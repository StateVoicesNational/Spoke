[![Build Status](https://travis-ci.org/MoveOnOrg/Spoke.svg?branch=master)](https://travis-ci.org/MoveOnOrg/Spoke)

# Spoke

Spoke is an open source text-distribution tool for organizations to mobilize supporters and members into action. Spoke allows you to upload phone numbers, customize scripts and assign volunteers to communicate with supporters while allowing organizations to manage the process.

Spoke was created by Saikat Chakrabarti and Sheena Pakanati, and is now maintained by MoveOn.org.

## Note

This is generated from [react-apollo-starter-kit](https://github.com/saikat/react-apollo-starter-kit).  Look at that project's README for info on some of the libraries used.

## Deploy to Heroku

<a href="https://heroku.com/deploy?template=https://github.com/shakalee14/Spoke">
  <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
</a>

WARNING --> this template will incur costs

Follow up instructions located [here](https://github.com/shakalee14/Spoke/blob/master/docs/HOWTO_HEROKU_DEPLOY.md)


## Getting started

1. Install either sqlite (or another [knex](http://knexjs.org/#Installation-client)-supported database)
2. Install the Node version listed under `engines` in `package.json`. [NVM](https://github.com/creationix/nvm) is one way to do this.
3. `npm install`
4. `npm install -g foreman`
5. `cp .env.example .env`
6. Run `npm run dev` to create and populate the tables.
7. Create an [Auth0](https://auth0.com) account. In your Auth0 account, go to Settings -> Clients -> and then grab your Client ID, Client Secret, and your Auth0 domain (should look like xxx.auth0.com). Add those inside your `.env` file (AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_DOMAIN respectively).
8. Add the login callback and logout callback URL in `.env` (default `http://localhost:3000/login-callback` and `http://localhost:3000/logout-callback`) to your Auth0 app settings under "Allowed Callback URLs" and "Allowed Logout URLs" respectively. (If you get an error when logging in later about "OIDC", go to Advanced Settings section, and then OAuth, and turn off 'OIDC Conformant')
9. Run `npm run dev` to start the app. Wait until you see both "Node app is running ..." and "Webpack dev server is now running ..." before attempting to connect. (make sure environment variable JOBS_SAME_PROCESS=1)
10. Go to `localhost:3000` to load the app.
11. Because Spoke is invite-only you need to generate an invite. Run:
```
echo "INSERT INTO invite \(hash,is_valid\) VALUES \('abc-123', true\)\;" |sqlite3 mydb.sqlite
```

13. Use the generated key to visit an invite link, e.g.: http://localhost:3000/invite/123. This should redirect you to the login screen. Use the "Sign Up" option to create your account.
14. You should then be prompted to create an organization. Create it.

If you want to create an invite via the home page "Login and get started" link, make sure your `SUPPRESS_SELF_INVITE` variable is not set.

## Important TODOS
**Because  of issues with numbers getting marked with spam, we adopted aggressive number cycling to limit the number of texts sent from a specific number. We did not implement a corresponding process to unrent the numbers before shutting down the service, so two things are a high priority before putting Spoke back into production:
1. Decide whether to keep the number cycling, since it might not be necessary on Twilio like it was on Nexmo
2. If keeping it making sure there's a corresponding process to unrent unused numbers.
3. Even if not keeping number cycling, there should be a process like this anyway to unrent numbers that haven't been used in X days anyway because volunteers come and go. However, cycling numbers every ~250 texts obviously racks up exponentially higher costs than just assigning a single number per volunteer.  **

## Helpful Dev Tips
* Go to `localhost:3000/graphql` to mess around with the GraphQL API
* Run `sqlite3 mydb.sqlite` to connect to a SQL shell for the dev database
* [Set up an ESLint plugin in your code editor so that you catch coding errors and follow code style guidelines more easily!](https://medium.com/planet-arkency/catch-mistakes-before-you-run-you-javascript-code-6e524c36f0c8#.oboqsse48)
* [Install the redux-devtools-extension](https://github.com/zalmoxisus/redux-devtools-extension) in Chrome to get advanced Redux debugging features.
* Right now there is a bug in Apollo (https://github.com/apollostack/react-apollo/issues/57) that means in one particular case, errors get swallowed.  If you end up with an app that is silently breaking, console.log(this.props.data) and check the errors property.


## Testing Twilio

If you need to use Twilio in development but with live keys, do the following to receive incoming replies:

1. Start [ngrok](https://ngrok.com/docs)
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
