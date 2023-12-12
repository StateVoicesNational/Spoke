import "babel-polyfill";
import bodyParser from "body-parser";
import express from "express";
import appRenderer from "./middleware/app-renderer";
import { graphqlExpress, graphiqlExpress } from "apollo-server-express";
import { makeExecutableSchema } from "@graphql-tools/schema";
// ORDERING: ./models import must be imported above ./api to help circular imports
import { replaceEasyGsmWins } from "../lib/gsm";
import { createLoaders, createTablesIfNecessary, r } from "./models";
import { resolvers } from "./api/schema";
import { schema } from "../api/schema";
import passport from "passport";
import cookieSession from "cookie-session";
import passportSetup from "./auth-passport";
import { log } from "../lib";
import telemetry from "./telemetry";
import { addServerEndpoints as messagingServicesAddServerEndpoints } from "../extensions/service-vendors/service_map";
import { getConfig } from "./api/lib/config";
import { seedZipCodes } from "./seeds/seed-zip-codes";
import { setupUserNotificationObservers } from "./notifications";
import { existsSync } from "fs";
import { rawAllMethods } from "../extensions/contact-loaders";
import herokuSslRedirect from "heroku-ssl-redirect";
import { GraphQLError } from "graphql/error";

process.on("uncaughtException", ex => {
  log.error(ex);
  process.exit(1);
});
const DEBUG = process.env.NODE_ENV === "development";

if (!getConfig("SUPPRESS_DATABASE_AUTOCREATE", null, { truthy: 1 })) {
  createTablesIfNecessary().then(didCreate => {
    // seed above won't have succeeded if we needed to create first
    if (didCreate && !getConfig("SUPPRESS_SEED_CALLS", null, { truthy: 1 })) {
      seedZipCodes();
    }
    if (!didCreate && !getConfig("SUPPRESS_MIGRATIONS", null, { truthy: 1 })) {
      r.k.migrate.latest();
    }
  });
} else {
  if (!getConfig("SUPPRESS_MIGRATIONS", null, { truthy: 1 })) {
    r.k.migrate.latest();
  }
  if (!getConfig("SUPPRESS_SEED_CALLS", null, { truthy: 1 })) {
    seedZipCodes();
  }
}

setupUserNotificationObservers();
const app = express();
// Heroku requires you to use process.env.PORT
const port = process.env.DEV_APP_PORT || process.env.PORT;

// Don't rate limit heroku
app.enable("trust proxy");

if (process.env.HEROKU_APP_NAME) {
  // if on Heroku redirect to https if accessed via http
  app.use(herokuSslRedirect());
}

// Serve static assets
if (existsSync(process.env.ASSETS_DIR)) {
  app.use(
    "/assets",
    express.static(process.env.ASSETS_DIR, {
      maxAge: "180 days"
    })
  );
}

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cookieSession({
    cookie: {
      httpOnly: true,
      secure: !DEBUG,
      maxAge: null
    },
    secret: process.env.SESSION_SECRET || global.SESSION_SECRET
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  const getContext = app.get("awsContextGetter");
  if (typeof getContext === "function") {
    const [event, context] = getContext(req, res);
    req.awsEvent = event;
    req.awsContext = context;
  }
  next();
});

// Simulate latency in local development
if (process.env.SIMULATE_DELAY_MILLIS) {
  app.use((req, res, next) => {
    setTimeout(next, Number(process.env.SIMULATE_DELAY_MILLIS));
  });
}

// give contact loaders a chance
const configuredIngestMethods = rawAllMethods();
Object.keys(configuredIngestMethods).forEach(ingestMethodName => {
  const ingestMethod = configuredIngestMethods[ingestMethodName];
  if (ingestMethod && ingestMethod.addServerEndpoints) {
    ingestMethod.addServerEndpoints(app);
  }
});

const routeAdders = {
  get: (_app, route, ...handlers) => _app.get(route, ...handlers),
  post: (_app, route, ...handlers) => _app.post(route, ...handlers)
};

messagingServicesAddServerEndpoints(app, routeAdders);

app.get("/logout-callback", (req, res) => {
  req.logOut();
  res.redirect("/");
});

const loginCallbacks = passportSetup[
  process.env.PASSPORT_STRATEGY || global.PASSPORT_STRATEGY || "auth0"
](app);

if (loginCallbacks) {
  app.get("/login-callback", ...loginCallbacks.loginCallback);
  app.post("/login-callback", ...loginCallbacks.loginCallback);
}

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
  allowUndefinedInResolve: false
});

app.use(
  "/graphql",
  graphqlExpress(request => ({
    schema: executableSchema,
    context: {
      loaders: createLoaders(),
      user: request.user,
      awsContext: request.awsContext || null,
      awsEvent: request.awsEvent || null,
      remainingMilliseconds: () =>
        request.awsContext && request.awsContext.getRemainingTimeInMillis
          ? request.awsContext.getRemainingTimeInMillis()
          : 5 * 60 * 1000 // default saying 5 min, no matter what
    },
    formatError: error => {
      log.error({
        userId: request.user && request.user.id,
        code:
          (error && error.originalError && error.originalError.code) ||
          "INTERNAL_SERVER_ERROR",
        error,
        msg: "GraphQL error"
      });
      telemetry
        .formatRequestError(error, request)
        // drop if this fails
        .catch(() => {})
        .then(() => {});

      if (process.env.SHOW_SERVER_ERROR || process.env.DEBUG) {
        if (error instanceof GraphQLError) {
          return error;
        }
        return new GraphQLError(error.message);
      }

      return new GraphQLError(
        error &&
        error.originalError &&
        error.originalError.code === "UNAUTHORIZED"
          ? "UNAUTHORIZED"
          : "Internal server error"
      );
    }
  }))
);
app.get(
  "/graphiql",
  graphiqlExpress({
    endpointURL: "/graphql"
  })
);

// This middleware should be last. Return the React app only if no other route is hit.
app.use(appRenderer);

if (port) {
  app.listen(port, () => {
    log.info(`Node app is running on port ${port}`);
  });
}

export default app;
