import "babel-polyfill";
import bodyParser from "body-parser";
import express from "express";
import appRenderer from "./middleware/app-renderer";
import { graphqlExpress, graphiqlExpress } from "apollo-server-express";
import { makeExecutableSchema, addMockFunctionsToSchema } from "graphql-tools";
// ORDERING: ./models import must be imported above ./api to help circular imports
import { createLoaders, createTablesIfNecessary, r } from "./models";
import { resolvers } from "./api/schema";
import { schema } from "../api/schema";
import passport from "passport";
import cookieSession from "cookie-session";
import passportSetup from "./auth-passport";
import wrap from "./wrap";
import { log } from "../lib";
import nexmo from "./api/lib/nexmo";
import twilio from "./api/lib/twilio";
import { seedZipCodes } from "./seeds/seed-zip-codes";
import { setupUserNotificationObservers } from "./notifications";
import { twiml } from "twilio";
import { existsSync } from "fs";
import { rawAllMethods } from "../integrations/contact-loaders";

process.on("uncaughtException", ex => {
  log.error(ex);
  process.exit(1);
});
const DEBUG = process.env.NODE_ENV === "development";

if (!process.env.SUPPRESS_SEED_CALLS) {
  seedZipCodes();
}

if (!process.env.SUPPRESS_DATABASE_AUTOCREATE) {
  createTablesIfNecessary().then(didCreate => {
    // seed above won't have succeeded if we needed to create first
    if (didCreate && !process.env.SUPPRESS_SEED_CALLS) {
      seedZipCodes();
    }
    if (!didCreate && !process.env.SUPPRESS_MIGRATIONS) {
      r.k.migrate.latest();
    }
  });
} else if (!process.env.SUPPRESS_MIGRATIONS) {
  r.k.migrate.latest();
}

setupUserNotificationObservers();
const app = express();
// Heroku requires you to use process.env.PORT
const port = process.env.DEV_APP_PORT || process.env.PORT;

// Don't rate limit heroku
app.enable("trust proxy");

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

app.post(
  "/twilio/:orgId?",
  twilio.headerValidator(),
  wrap(async (req, res) => {
    try {
      await twilio.handleIncomingMessage(req.body);
    } catch (ex) {
      log.error(ex);
    }

    const resp = new twiml.MessagingResponse();
    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(resp.toString());
  })
);

if (process.env.NEXMO_API_KEY) {
  app.post(
    "/nexmo",
    wrap(async (req, res) => {
      try {
        const messageId = await nexmo.handleIncomingMessage(req.body);
        res.send(messageId);
      } catch (ex) {
        log.error(ex);
        res.send("done");
      }
    })
  );

  app.post(
    "/nexmo-message-report",
    wrap(async (req, res) => {
      try {
        const body = req.body;
        await nexmo.handleDeliveryReport(body);
      } catch (ex) {
        log.error(ex);
      }
      res.send("done");
    })
  );
}

app.post(
  "/twilio-message-report",
  wrap(async (req, res) => {
    try {
      const body = req.body;
      await twilio.handleDeliveryReport(body);
    } catch (ex) {
      log.error(ex);
    }
    const resp = new twiml.MessagingResponse();
    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(resp.toString());
  })
);

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
