import passport from "passport";
import Auth0Strategy from "passport-auth0";
import { Strategy as LocalStrategy } from "passport-local";
import slack from "@aoberoi/passport-slack";
import { User, UserOrganization, Organization, cacheableData } from "./models";
import localAuthHelpers from "./local-auth-helpers";
import wrap from "./wrap";
import { capitalizeWord } from "./api/lib/utils";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

export const nextUrlRedirect = (nextUrl, defaultPath) =>
  nextUrl && !nextUrl.startsWith("http") ? nextUrl : defaultPath || "/";

export function setupAuth0Passport() {
  const strategy = new Auth0Strategy(
    {
      domain: process.env.AUTH0_DOMAIN,
      clientID: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/login-callback`
    },
    (accessToken, refreshToken, extraParams, profile, done) =>
      done(null, profile)
  );

  passport.use(strategy);

  passport.serializeUser((user, done) => {
    // This is the Auth0 user object, not the db one
    // eslint-disable-next-line no-underscore-dangle
    const auth0Id = user.id || user._json.sub;
    done(null, auth0Id);
  });

  passport.deserializeUser(
    wrap(async (id, done) => {
      // add new cacheable query
      const user = await cacheableData.user.userLoggedIn("auth0_id", id);
      done(null, user || false);
    })
  );

  return {
    loginCallback: [
      passport.authenticate("auth0", { failureRedirect: "/login" }),
      wrap(async (req, res) => {
        // eslint-disable-next-line no-underscore-dangle
        const auth0Id = req.user && (req.user.id || req.user._json.sub);
        if (!auth0Id) {
          throw new Error("Null user in login callback");
        }
        const existingUser = await User.filter({ auth0_id: auth0Id });

        if (existingUser.length === 0) {
          const userMetadata =
            // eslint-disable-next-line no-underscore-dangle
            req.user._json["https://spoke/user_metadata"] ||
            // eslint-disable-next-line no-underscore-dangle
            req.user._json.user_metadata ||
            {};
          const userData = {
            auth0_id: auth0Id,
            // eslint-disable-next-line no-underscore-dangle
            first_name: capitalizeWord(userMetadata.given_name) || "",
            // eslint-disable-next-line no-underscore-dangle
            last_name: capitalizeWord(userMetadata.family_name) || "",
            cell: userMetadata.cell || "",
            // eslint-disable-next-line no-underscore-dangle
            email: req.user._json.email,
            is_superadmin: false
          };
          const finalUser = await User.save(userData);
          if (finalUser && finalUser.id === 1) {
            await r
              .knex("user")
              .where("id", 1)
              .update({ is_superadmin: true });
          }
          res.redirect(nextUrlRedirect(req.query.state, "terms"));
          return;
        }
        res.redirect(nextUrlRedirect(req.query.state));
        return;
      })
    ]
  };
}

export function setupLocalAuthPassport() {
  const strategy = new LocalStrategy(
    {
      usernameField: "email",
      passReqToCallback: true
    },
    wrap(async (req, username, password, done) => {
      const lowerCaseEmail = username.toLowerCase();
      const existingUser = await User.filter({ email: lowerCaseEmail });
      const nextUrl = req.body.nextUrl || "";
      const uuidMatch = nextUrl.match(/\w{8}-(\w{4}\-){3}\w{12}/);

      // Run login, signup, or reset functions based on request data
      if (req.body.authType && !localAuthHelpers[req.body.authType]) {
        return done(null, false);
      }
      try {
        const user = await localAuthHelpers[req.body.authType]({
          lowerCaseEmail,
          password,
          existingUser,
          nextUrl,
          uuidMatch,
          reqBody: req.body
        });
        return done(null, user);
      } catch (err) {
        return done(null, false, err.message);
      }
    })
  );

  passport.use(strategy);

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(
    wrap(async (id, done) => {
      const userId = parseInt(id, 10);
      const user =
        userId && (await cacheableData.user.userLoggedIn("id", userId));
      done(null, user || false);
    })
  );

  return {
    loginCallback: [
      passport.authenticate("local"),
      (req, res) => {
        res.redirect(nextUrlRedirect(req.body.nextUrl));
      }
    ]
  };
}
export function setupTokenPassport(app) {
  var opts = {};

  opts.jwtFromRequest = ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    ExtractJwt.fromBodyField("jwt"),
    ExtractJwt.fromUrlQueryParameter("jwt")
  ]);

  opts.secretOrKey = process.env.TOKEN_AUTH_SHARED_SECRET;
  opts.issuer = process.env.TOKEN_AUTH_ISSUER;
  opts.audience = process.env.TOKEN_AUTH_AUDIENCE;

  passport.use(
    "token",
    new JwtStrategy(opts, async function(jwt_payload, done) {
      User.filter({ email: jwt_payload.sub })
        .then(users => {
          if (users.length === 0) {
            const userData = {
              auth0_id: ["token", jwt_payload.sub].join("|"),
              first_name: jwt_payload.name.split(" ")[0],
              last_name: jwt_payload.name
                .split(" ")
                .slice(1)
                .join(" "),
              cell: "",
              email: jwt_payload.email || jwt_payload.sub,
              is_superadmin: false
            };

            return User.save(userData);
          }

          return users[0];
        })
        .then(user => {
          UserOrganization.filter({ user_id: user.id }).then(userOrgs => {
            if (typeof jwt_payload.user_organizations === "undefined") {
              // JWT does not contain any assertions about user roles
              // so leaving that up to whatever the user has configured

              done(null, user);
              return;
            }

            const jwtUserOrgs = jwt_payload.user_organizations || [];
            const userOrgIdsInDatabase = userOrgs.map(
              existing => existing.organization_id
            );
            const userOrgIdsInAssertion = jwtUserOrgs.map(
              asserted => asserted.organization_id
            );

            // Adding user to orgs based on jwt
            const createPromises = jwtUserOrgs
              .filter(uo => !userOrgIdsInDatabase.includes(uo.organization_id))
              .map(asserted => ({
                user_id: user.id,
                organization_id: asserted.organization_id,
                role: asserted.role
              }))
              .map(userOrg => UserOrganization.save(userOrg));

            // Syncing roles in orgs that match both
            const updatePromises = userOrgs
              .filter(uo => userOrgIdsInAssertion.includes(uo.organization_id))
              .map(userOrg => {
                const { role } = jwtUserOrgs.find(
                  a => a.organization_id == userOrg.organization_id
                );
                // Role is the only thing that can be updated
                userOrg.role = role;

                return userOrg.save();
              });

            Promise.all([...createPromises, ...updatePromises]).then(() =>
              done(null, user)
            );
          });
        });
    })
  );

  app.get("/login/token-redirect", (req, res) => {
    const callbackUrl = new URL("/login-callback", process.env.BASE_URL);
    callbackUrl.searchParams.set("nextUrl", req.query.nextUrl || "");

    const tokenAuthUrl = new URL(process.env.TOKEN_AUTH_URL);
    tokenAuthUrl.searchParams.set("callback", callbackUrl);

    res.redirect(tokenAuthUrl);
  });

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(
    wrap(async (id, done) => {
      const userId = parseInt(id, 10);
      const user =
        userId && (await cacheableData.user.userLoggedIn("id", userId));
      done(null, user || false);
    })
  );

  return {
    loginCallback: [
      passport.authenticate("token"),
      (req, res) => {
        res.redirect(nextUrlRedirect(req.query.nextUrl));
      }
    ]
  };
}

function slackLoginId(teamId, userId) {
  return ["slack", teamId, userId].join("|");
}

export function setupSlackPassport(app) {
  passport.use(
    new slack.Strategy(
      {
        clientID: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET,
        callbackURL: `${process.env.BASE_URL}/login-callback`,
        authorizationURL: process.env.SLACK_TEAM_NAME
          ? `https://${process.env.SLACK_TEAM_NAME}.slack.com/oauth/authorize`
          : undefined
      },
      function(
        accessToken,
        scopes,
        team,
        { bot, incomingWebhook },
        { user: userProfile, team: teamProfile },
        done
      ) {
        done(null, {
          ...userProfile,
          team: teamProfile
        });
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, slackLoginId(user.team.id, user.id));
  });

  passport.deserializeUser(
    wrap(async (id, done) => {
      if (typeof id !== "string") {
        // probably switched from password auth to slack auth
        console.error(`Got non-string ID in slack passport deserialize: ${id}`);
        done(null, false);
        return;
      }

      const [loginType, teamId, userId] = id.split("|");

      if (loginType !== "slack") {
        console.error(`Invalid loginType in session token: ${loginType}`);
        done(null, false);
        return;
      }

      if (teamId !== process.env.SLACK_TEAM_ID) {
        console.error(`Invalid team ID in session token: ${teamId}`);
        done(null, false);
        return;
      }

      const user = await cacheableData.user.userLoggedIn(
        "auth0_id",
        slackLoginId(teamId, userId)
      );
      done(null, user || false);
    })
  );

  app.get("/login/slack-redirect", (req, res) => {
    passport.authenticate("slack", {
      scope: ["identity.basic", "identity.email", "identity.team"],
      team: process.env.SLACK_TEAM_ID,
      state: req.query.nextUrl
    })(req, res);
  });

  return {
    loginCallback: [
      passport.authenticate("slack", { failureRedirect: "/login" }),
      wrap(async (req, res) => {
        const slackUser = req.user;

        if (slackUser.team.id !== process.env.SLACK_TEAM_ID) {
          res.send("Logged in using the wrong slack team");
          return;
        }

        const loginId = slackLoginId(slackUser.team.id, slackUser.id);
        const existingUser = await User.filter({ auth0_id: loginId });

        if (existingUser.length > 0) {
          // user already exists
          res.redirect(nextUrlRedirect(req.query.state));
          return;
        }

        const userData = {
          auth0_id: loginId,
          first_name: slackUser.name.split(" ")[0],
          last_name: slackUser.name
            .split(" ")
            .slice(1)
            .join(" "),
          cell: "",
          email: slackUser.email,
          is_superadmin: false
        };
        const finalUser = await User.save(userData);
        if (finalUser && finalUser.id === 1) {
          await r
            .knex("user")
            .where("id", 1)
            .update({ is_superadmin: true });
        }
        res.redirect(nextUrlRedirect(req.query.state)); // TODO: terms?
      })
    ]
  };
}

export default {
  local: setupLocalAuthPassport,
  auth0: setupAuth0Passport,
  slack: setupSlackPassport,
  token: setupTokenPassport
};
