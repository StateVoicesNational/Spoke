[![Build Status](https://travis-ci.org/MoveOnOrg/Spoke.svg?branch=main)](https://travis-ci.org/MoveOnOrg/Spoke)

[![Sauce Test Status](https://saucelabs.com/buildstatus/opensourcemoveon)](https://saucelabs.com/u/opensourcemoveon)
# Spoke

Spoke is an open source text-distribution tool for organizations to mobilize supporters and members into action. Spoke allows you to upload phone numbers, customize scripts and assign volunteers to communicate with supporters while allowing organizations to manage the process.

Spoke was created by Saikat Chakrabarti and Sheena Pakanati, and is now maintained by MoveOn.org.

The latest version is [1.4.0](https://github.com/MoveOnOrg/Spoke/tree/v1.4) (see [release notes](https://github.com/MoveOnOrg/Spoke/blob/main/docs/RELEASE_NOTES.md#v12)) which we recommend for production use, while our `main` branch is where features still in development and testing will be available.

## Note

This is generated from [react-apollo-starter-kit](https://github.com/saikat/react-apollo-starter-kit).  Look at that project's README for info on some of the libraries used.

## Deploy to Heroku

<a href="https://heroku.com/deploy?template=https://github.com/MoveOnOrg/Spoke/tree/v1.4">
  <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
</a>

Follow up instructions located [here](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_HEROKU_DEPLOY.md)

Please let us know if you deployed by filling out this form [here](https://act.moveon.org/survey/tech/)

## Getting started

1. Install either sqlite (or another [knex](http://knexjs.org/#Installation-client)-supported database)
2. Install the Node version listed under `engines` in `package.json`. [NVM](https://github.com/creationix/nvm) is one way to do this.
3. `npm install`
4. `npm install -g foreman`
5. `cp .env.example .env`
6. If you want to use Postgres:
    - In `.env` set `DB_TYPE=pg`. (Otherwise, you will use sqlite.)
    - Set `DB_PORT=5432`, which is the default port for Postgres.
    - Create the spokedev database:  `psql -c "create database spokedev;"`
7. Create an [Auth0](https://auth0.com) account. In your Auth0 account, go to [Applications](https://manage.auth0.com/#/applications/), click on `Default App` and then grab your Client ID, Client Secret, and your Auth0 domain (should look like xxx.auth0.com). Add those inside your `.env` file (AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_DOMAIN respectively).
8. Run `npm run dev` to create and populate the tables.
9. In your Auth0 app settings, add `http://localhost:3000/login-callback` , `http://localhost:3000` and `http://localhost:3000/logout-callback` to "Allowed Callback URLs", "Allowed Web Origins" and  "Allowed Logout URLs" respectively. (If you get an error when logging in later about "OIDC", go to Advanced Settings section, and then OAuth, and turn off 'OIDC Conformant')
10. Add a new [rule](https://manage.auth0.com/#/rules/create) in Auth0:
```javascript
function (user, context, callback) {
context.idToken["https://spoke/user_metadata"] = user.user_metadata;
callback(null, user, context);
}
```
11. If the application is still running from step 8, kill the process and re-run `npm run dev` to restart the app. Wait until you see both "Node app is running ..." and "webpack: Compiled successfully." before attempting to connect. (make sure environment variable `JOBS_SAME_PROCESS=1`)
12. Go to `http://localhost:3000` to load the app.
13. As long as you leave `SUPPRESS_SELF_INVITE=` blank and unset in your `.env` you should be able to invite yourself from the homepage.
    - If you DO set that variable, then spoke will be invite-only and you'll need to generate an invite. Run:
```
echo "INSERT INTO invite (hash,is_valid) VALUES ('abc', 1);" |sqlite3 mydb.sqlite
# Note: When doing this with PostgreSQL, you would replace the `1` with `true`
```
  - Then use the generated key to visit an invite link, e.g.: http://localhost:3000/invite/abc. This should redirect you to the login screen. Use the "Sign Up" option to create your account.

14. You should then be prompted to create an organization. Create it.

If you want to create an invite via the home page "Login and get started" link, make sure your `SUPPRESS_SELF_INVITE` variable is not set.

## Running Tests

See https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO-run_tests.md

## Big Thanks
Cross-browser Testing Platform and Open Source <3 Provided by [Sauce Labs](https://saucelabs.com).

## Helpful Dev Tips
* Run `sqlite3 mydb.sqlite` to connect to a SQL shell for the dev database
* [Set up an ESLint plugin in your code editor so that you catch coding errors and follow code style guidelines more easily!](https://medium.com/planet-arkency/catch-mistakes-before-you-run-you-javascript-code-6e524c36f0c8#.oboqsse48)
* [Install the redux-devtools-extension](https://github.com/zalmoxisus/redux-devtools-extension) in Chrome to get advanced Redux debugging features.
* Right now there is a bug in Apollo (https://github.com/apollostack/react-apollo/issues/57) that means in one particular case, errors get swallowed.  If you end up with an app that is silently breaking, console.log(this.props.data) and check the errors property.

### SMS

For development, you can set `DEFAULT_SERVICE=fakeservice` to skip using an SMS provider (Twilio or Nexmo) and insert the message directly into the database.

To simulate receiving a reply from a contact you can use the Send Replies utility: `http://localhost:3000/admin/1/campaigns/1/send-replies`, updating the app and campaign IDs as necessary.

**Twilio**

Twilio provides test credentials that will not charge your account as described in their [documentation](https://www.twilio.com/docs/iam/test-credentials). You may use either your test credentials or your live keys by following the instructions [here](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_INTEGRATE_TWILIO.md).

## Deploying

1. Run `OUTPUT_DIR=./build npm run prod-build-server`
   This will generate something you can deploy to production in ./build and run nodejs server/server/index.js
2. Run `npm run prod-build-client`
3. Make a copy of `deploy/spoke-pm2.config.js.template`, e.g. `spoke-pm2.config.js`, add missing environment variables, and run it with [pm2](https://www.npmjs.com/package/pm2), e.g. `pm2 start spoke-pm2.config.js --env production`
4. [Install PostgreSQL](https://wiki.postgresql.org/wiki/Detailed_installation_guides)
5. Start PostgreSQL (e.g. `sudo /etc/init.d/postgresql start`), connect (e.g. `sudo -u postgres psql`), create a user and database (e.g. `create user spoke password 'spoke'; create database spoke owner spoke;`), disconnect (e.g. `\q`) and add credentials to `DB_` variables in spoke-pm2.config.js

# License
Spoke is licensed under the MIT license.
