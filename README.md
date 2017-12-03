[![Build Status](https://travis-ci.org/MoveOnOrg/Spoke.svg?branch=master)](https://travis-ci.org/MoveOnOrg/Spoke)

# Spoke

Spoke is an open source text-distribution tool for organizations to mobilize supporters and members into action. Spoke allows you to upload phone numbers, customize scripts and assign volunteers to communicate with supporters while allowing organizations to manage the process.

Spoke was created by Saikat Chakrabarti and Sheena Pakanati, and is now maintained by MoveOn.org.

The latest version is [1.1.0](https://github.com/MoveOnOrg/Spoke/tree/v1.1) (see [release notes](https://github.com/MoveOnOrg/Spoke/blob/master/docs/RELEASE_NOTES.md#v11)) which we recommend for production use, while our `master` branch is where features still in development and testing will be available.

## Note

This is generated from [react-apollo-starter-kit](https://github.com/saikat/react-apollo-starter-kit).  Look at that project's README for info on some of the libraries used.

## Deploy to Heroku

<a href="https://heroku.com/deploy?template=https://github.com/MoveOnOrg/Spoke">
  <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
</a>

Follow up instructions located [here](https://github.com/MoveOnOrg/Spoke/blob/master/docs/HOWTO_HEROKU_DEPLOY.md)

## Getting started

1. Install either sqlite (or another [knex](http://knexjs.org/#Installation-client)-supported database)
2. Install the Node version listed under `engines` in `package.json`. [NVM](https://github.com/creationix/nvm) is one way to do this.
3. `npm install`
4. `npm install -g foreman`
5. `cp .env.example .env`
6. Create an [Auth0](https://auth0.com) account. In your Auth0 account, go to Settings -> Clients -> and then grab your Client ID, Client Secret, and your Auth0 domain (should look like xxx.auth0.com). Add those inside your `.env` file (AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_DOMAIN respectively).
7. Run `npm run dev` to create and populate the tables.
8. Add the login callback and logout callback URL in `.env` (default `http://localhost:3000/login-callback` and `http://localhost:3000/logout-callback`) to your Auth0 app settings under "Allowed Callback URLs" and "Allowed Logout URLs" respectively. (If you get an error when logging in later about "OIDC", go to Advanced Settings section, and then OAuth, and turn off 'OIDC Conformant')
9. Run `npm run dev` to start the app. Wait until you see both "Node app is running ..." and "Webpack dev server is now running ..." before attempting to connect. (make sure environment variable `JOBS_SAME_PROCESS=1`)
10. Go to `http://localhost:3000` to load the app.
11. As long as you leave `SUPPRESS_SELF_INVITE=` blank and unset in your `.env` you should be able to invite yourself from the homepage.
  - If you DO set that variable, then spoke will be invite-only and you'll need to generate an invite. Run:
```
echo "INSERT INTO invite (hash,is_valid) VALUES ('abc', 1);" |sqlite3 mydb.sqlite
# Note: When doing this with PostgreSQL, you would replace the `1` with `true`
```
  - Then use the generated key to visit an invite link, e.g.: http://localhost:3000/invite/abc. This should redirect you to the login screen. Use the "Sign Up" option to create your account.

12. You should then be prompted to create an organization. Create it.

If you want to create an invite via the home page "Login and get started" link, make sure your `SUPPRESS_SELF_INVITE` variable is not set.

## Running Tests

See https://github.com/MoveOnOrg/Spoke/blob/master/docs/HOWTO-run_tests.md


## Helpful Dev Tips
* Run `sqlite3 mydb.sqlite` to connect to a SQL shell for the dev database
* [Set up an ESLint plugin in your code editor so that you catch coding errors and follow code style guidelines more easily!](https://medium.com/planet-arkency/catch-mistakes-before-you-run-you-javascript-code-6e524c36f0c8#.oboqsse48)
* [Install the redux-devtools-extension](https://github.com/zalmoxisus/redux-devtools-extension) in Chrome to get advanced Redux debugging features.
* Right now there is a bug in Apollo (https://github.com/apollostack/react-apollo/issues/57) that means in one particular case, errors get swallowed.  If you end up with an app that is silently breaking, console.log(this.props.data) and check the errors property.


## Testing Twilio

You will need to create a Twilio account in order to test outgoing and incoming replies. If you need to use Twilio in development but with live keys, do the following to receive incoming replies:

1. Start [ngrok](https://ngrok.com/docs) --> you will use the url created for the `TWILIO_STATUS_CALLBACK_URL` in your .env file and `STATUS CALLBACK URL` in Twilio
2. Create a Twilio acccount: https://www.twilio.com/
3. Click on `Programmable SMS` on the side panel
4. Click on `Messaging Services`, and click the plus
5. Create a friendly name
6. Under `Properties`
  - `SERVICE SID` is `TWILIO_MESSAGE_SERVICE_SID`
7. Under `Inbound Settings`
  - Make sure `PROCESS INBOUND MESSAGES` is selected
  - `REQUEST URL` is `https://<YOUR_HEROKU_APP_URL>/twilio`
8. Under Outbound Settings
  - `STATUS CALLBACK URL` is `https://[ngrok-generated-url]/twilio-message-report`
  - TWILIO_STATUS_CALLBACK_URL = `https://[ngrok-generated-url]/twilio-message-report`
9. Visit the [dashboard](https://www.twilio.com/console)
10. Under `Account Summary`
  - TWILIO_API_KEY is `ACCOUNT SID`
  - TWILIO_APPLICATION_SID is `TWILIO_MESSAGE_SERVICE_SID` (these are the same values)
  - TWILIO_AUTH_TOKEN is `AUTH TOKEN`

2. Visit https://www.twilio.com/console/voice/dev-tools/twiml-apps and go to the Spoke Dev app.
3. Set Request URL under "Messaging" to http://<<YOUR_NGROK>>.ngrok.io/twilio
4. In `.env` set `TWILIO_APPLICATION_ID` to the Twilio Spoke Dev application ID
5. In `.env` set `TWILIO_STATUS_CALLBACK_URL` to  http://<<YOUR_NGROK>>.ngrok.io/twilio-message-report

## Deploying

1. Run `OUTPUT_DIR=./build npm run prod-build-server`
   This will generate something you can deploy to production in ./build and run nodejs server/server/index.js
2. Run `npm run prod-build-client`
3. Make a copy of `deploy/spoke-pm2.config.js.template`, e.g. `spoke-pm2.config.js`, add missing environment variables, and run it with [pm2](https://www.npmjs.com/package/pm2), e.g. `pm2 start spoke-pm2.config.js --env production`
4. [Install PostgreSQL](https://wiki.postgresql.org/wiki/Detailed_installation_guides)
5. Start PostgreSQL (e.g. `sudo /etc/init.d/postgresql start`), connect (e.g. `sudo -u postgres psql`), create a user and database (e.g. `create user spoke password 'spoke'; create database spoke owner spoke;`), disconnect (e.g. `\q`) and add credentials to `DB_` variables in spoke-pm2.config.js

# License
Spoke is licensed under the MIT license.
