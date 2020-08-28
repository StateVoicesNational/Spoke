[![Build Status](https://travis-ci.org/MoveOnOrg/Spoke.svg?branch=main)](https://travis-ci.org/MoveOnOrg/Spoke)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v1.4%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)

# Spoke

Spoke is an open source text-distribution tool for organizations to mobilize supporters and members into action. Spoke allows you to upload phone numbers, customize scripts and assign volunteers to communicate with supporters while allowing organizations to manage the process.

Spoke was created by Saikat Chakrabarti and Sheena Pakanati, and is now maintained by MoveOn.org.

The latest version is [9.0](https://github.com/MoveOnOrg/Spoke/tree/v9.0) (see [release notes](https://github.com/MoveOnOrg/Spoke/blob/main/docs/RELEASE_NOTES.md#v90))

## Deploy to Heroku

Use the Heroku Button to deploy a version of Spoke suitable for testing. This won't cost any money and will not support production usage. It's a great way to practice deploying Spoke or see it in action.
<a href="https://heroku.com/deploy?template=https://github.com/MoveOnOrg/Spoke/tree/v9.0">
  <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
</a>

Or click [this link to deploy with a prod infrastructure set up to get up and running!](https://heroku.com/deploy?template=https://github.com/MoveOnOrg/Spoke/tree/heroku-button-paid)

**NOTE:** Deploying with prod infrastructure will cost $75 ($25 dyno + $50 postgres) a month and should be suitable for production level usage for most organizations.

Follow up instructions located [here](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_HEROKU_DEPLOY.md).

Please let us know if you deployed by filling out this form [here](https://act.moveon.org/survey/tech/)

## Getting started
### Downloading

1. Install the Node version listed in `.nvmrc`. [NVM](https://github.com/creationix/nvm) is one way to do this (from the spoke directory):
   ```
   nvm install
   nvm use
   ```
2. Install yarn.

- Yarn is a package manager that will download all required packages to run Spoke.
- Install using the [directions provided by Yarn](https://yarnpkg.com/en/docs/install).

3. Install the packages.
   ```
   yarn install
   ```
4. Create a real environment file:
   ```
   cp .env.example .env
   ```

- This creates a copy of `.env.example`, but renames it `.env` so the system will use it. _Make sure you use this new file._

### Your Database

We have 2 recommended ways to set up your databse for your development environment and you can choose either based on your preference or comfort level. You can use sqlite (which is the default DB so you can proceed to the next section if you choose this) or postgres. At this time, all production Spoke instances use postgres.

#### Using Docker to run postgres

Docker is optional, but can help with a consistent development environment using postgres. You can also set up postgres without docker ([documented here](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_USE_POSTGRESQL.md)) but we recommend the docker route.

1. Install docker and docker compose

- Docker allows you to run apps in containers and can be installed [here with Docker's instructions](https://docs.docker.com/desktop/)
- Docker Compose is the tool used to create and run docker configurations. If you installed Docker on Mac, you already have Docker Compose, if you're using Linux or Windows you can install Docker Compose [with these instructions](https://docs.docker.com/compose/install/)

2. Run `./dev-tools/create-test-database` to populate the test database

3. Make sure Docker is running on your machine and then build and run Spoke with `docker-compose up -d` to run redis and postgres in the background
   - You can stop docker compose at any time with `docker-compose down`, and data will persist next time you run `docker-compose up`.
4. When done testing, clean up resources with `docker-compose down`, or `docker-compose down -v` to **_completely destroy_** your Postgres database & Redis datastore volumes.

### Your `.env` file

If you're using postgres, you should set `DB_TYPE=pg` and if you're using sqlite, you don't need to change anything about your .env file.

We use environment variables to allow instance admins to customize their Spoke experience. If you end up doing dev work on an area that is configured through environment variables, it will be helpful to be familiar with the patterns used. Because of this, we recommend that you take a look at the [environment variable reference](https://github.com/MoveOnOrg/Spoke/blob/main/docs/REFERENCE-environment_variables.md) to get a lay of the land.

### Getting the app running

At this point, you should be ready to start your app in development mode.

1. Run `yarn dev` to create and populate the tables.
   - Wait until you see both "Node app is running ..." and "webpack: Compiled successfully." before attempting to connect. (make sure environment variable `JOBS_SAME_PROCESS=1`)
2. Go to `http://localhost:3000` to load the app. (Note: the terminal will say it's running on port 8090 -- don't believe it :-)
3. As long as you leave `SUPPRESS_SELF_INVITE=` blank in your `.env` you should be able to invite yourself from the homepage.
   - If you DO set that variable, then spoke will be invite-only and you'll need to generate an invite. Run:
     ```
     echo "INSERT INTO invite (hash,is_valid) VALUES ('E4502B28-301E-4E63-9A97-ACA14E8160C8', 1);" |sqlite3 mydb.sqlite
     # Note: When doing this with PostgreSQL, you would replace the `1` with `true`
     ```
   - Then use the generated key to visit an invite link, e.g.: http://localhost:3000/invite/E4502B28-301E-4E63-9A97-ACA14E8160C8. This should redirect you to the login screen. Use the "Sign Up" option to create your account.
4. You should then be prompted to create an organization. Create it.
5. Once you've created your organization, we recommend setting the env var `SUPPRESS_SELF_INVITE=1` so you don't get prompted to create a new org every time you log in
6. See the [Admin](https://youtu.be/PTMykMX8gII) and [Texter](https://youtu.be/EqE1UDvKGco) demos to learn about how Spoke works.
7. See [Getting Started with Development](#more-documentation) below.
8. See [How to Run Tests](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO-run_tests.md)

### SMS

For development, you can set `DEFAULT_SERVICE=fakeservice` to skip using an SMS provider (Twilio or Nexmo) and insert the message directly into the database.

To simulate receiving a reply from a contact you can use the Send Replies utility: `http://localhost:3000/admin/1/campaigns/1/send-replies`, updating the app and campaign IDs as necessary. You can also include "autorespond" in the script message text, and an automatic reply will be generated (just for `fakeservice`!)

**Twilio**

Twilio provides [test credentials](https://www.twilio.com/docs/iam/test-credentials) that will not charge your account as described in their documentation. To setup Twilio follow our [Twilio setup guide](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_INTEGRATE_TWILIO.md).

## More Documentation

- Getting Started with Development:
  - Welcome! Start with [CONTRIBUTING.md](./CONTRIBUTING.md) for community participation and engagement details.
  - [Development Guidelines and Tips](https://github.com/MoveOnOrg/Spoke/blob/main/docs/EXPLANATION-development-guidelines.md)
  - [Running Tests](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO-run_tests.md)
- More Development documentation

  - [A request example](https://github.com/MoveOnOrg/Spoke/blob/main/docs/EXPLANATION-request-example.md) pointing to different code points that all connect to it.
  - [GraphQL Debugging](https://github.com/MoveOnOrg/Spoke/blob/main/docs/GRAPHQL_DEBUG.md)
  - [Environment Variable Reference](https://github.com/MoveOnOrg/Spoke/blob/main/docs/REFERENCE-environment_variables.md)
  - [QA Guide](https://github.com/MoveOnOrg/Spoke/blob/main/docs/QA_GUIDE.md)

- Deploying

  - [Deploying with Heroku](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_HEROKU_DEPLOY.md) (and see Heroku deploy button above)
  - [Deploying on AWS Lambda](https://github.com/MoveOnOrg/Spoke/blob/main/docs/DEPLOYING_AWS_LAMBDA.md)
  - We recommend using [Auth0 for authentication](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO-configure-auth0.md) in deployed environments (Heroku docs have their own instructions)
  - [How to setup Twilio](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_INTEGRATE_TWILIO.md)
  - [Configuring Email](https://github.com/MoveOnOrg/Spoke/blob/main/docs/EMAIL_CONFIGURATION.md)
  - [Configuring Data Exports](https://github.com/MoveOnOrg/Spoke/blob/main/docs/DATA_EXPORTING.md) works
  - [Using Redis for Caching](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_CONNECT_WITH_REDIS.md) to improve server performance
  - Configuration for [Enforcing Texting Hours](https://github.com/MoveOnOrg/Spoke/blob/main/docs/TEXTING-HOURS-ENFORCEMENT.md)

- Integrations
  - [Contact Loaders](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO-use-contact-loaders.md)
  - [Action Handlers](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO-use-action-handlers.md)
    - [ActionKit](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_INTEGRATE_WITH_ACTIONKIT.md)
    - [Mobile Commons](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_INTEGRATE_WITH_MOBILE_COMMONS.md)
    - NGPVAN and everyaction ***(coming soon)***
    - [Revere](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_INTEGRATE_WITH_REVERE.md)

- Administration
  - Description of the different [Roles and Their Permissions](https://github.com/MoveOnOrg/Spoke/blob/main/docs/ROLES_DESCRIPTION.md)
  - Some DB queries for [Texter Activity](https://github.com/MoveOnOrg/Spoke/blob/main/docs/TEXTER_ACTIVITY_QUERIES.md)

## Deploying Minimally

There are several ways to deploy documented below. This is the 'most minimal' approach:

1. Run `OUTPUT_DIR=./build yarn run prod-build-server`
   This will generate something you can deploy to production in ./build and run nodejs server/server/index.js
2. Run `yarn run prod-build-client`
3. Make a copy of `deploy/spoke-pm2.config.js.template`, e.g. `spoke-pm2.config.js`, add missing environment variables, and run it with [pm2](https://www.npmjs.com/package/pm2), e.g. `pm2 start spoke-pm2.config.js --env production`
4. [Install PostgreSQL](https://wiki.postgresql.org/wiki/Detailed_installation_guides)
5. Start PostgreSQL (e.g. `sudo /etc/init.d/postgresql start`), connect (e.g. `sudo -u postgres psql`), create a user and database (e.g. `create user spoke password 'spoke'; create database spoke owner spoke;`), disconnect (e.g. `\q`) and add credentials to `DB_` variables in spoke-pm2.config.js

## Big Thanks

Cross-browser Testing Platform and Open Source <3 Provided by [Sauce Labs](https://saucelabs.com).

# License

Spoke is licensed under the MIT license.
