[![Build Status](https://travis-ci.org/MoveOnOrg/Spoke.svg?branch=main)](https://travis-ci.org/MoveOnOrg/Spoke)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v1.4%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)

# Spoke

Spoke is an open source text-distribution tool for organizations to mobilize supporters and members into action. Spoke allows you to upload phone numbers, customize scripts and assign volunteers to communicate with supporters while allowing organizations to manage the process.

Spoke was created by Saikat Chakrabarti and Sheena Pakanati, and is now maintained by MoveOn.org.

The latest version is [8.1](https://github.com/MoveOnOrg/Spoke/tree/v8.1) (see [release notes](https://github.com/MoveOnOrg/Spoke/blob/main/docs/RELEASE_NOTES.md#v81))



##Get Started:


The easiest way to get started is with the [Quick Start with Heroku] section below.  You can also learn about Spoke through the [user] and [admin] video demos or in the explanation on [how to decide if Spoke is right for you.](/EXPLANATION_DECIDING_ON_SPOKE.md)

For developers, please see our recomendations for [deploying locally for development](/HOWTO_DEVELOPMENT_LOCAL_SETUP.md).



### Quick Start with Heroku
This version of Spoke suitable for testing and, potentially, for small campaigns. This won't cost any money and will not support production usage. It's a great way to practice deploying Spoke or see it in action.  
<a href="https://heroku.com/deploy?template=https://github.com/MoveOnOrg/Spoke/tree/v8.0">

  <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
</a>

Follow up instructions located [here](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_HEROKU_DEPLOY.md).

**NOTE:** You can upgrade this deployment later for use in a production (aka large-scale) setting, but keep in mind you will lose the data from any prior campaigns.  Thus it is best to upgrade before you start any live campaigns.  This will cost $75 ($25 dyno + $50 postgres) a month and should be suitable for production level usage for most organizations. Alternatively, you can click [this link to deploy with a production infrastructure from the start!](https://heroku.com/deploy?template=https://github.com/MoveOnOrg/Spoke/tree/heroku-button-paid) 

Please let us know if you deployed by filling out this form [here](https://act.moveon.org/survey/tech/)


### Other Options for Production Use 

You can also[deploy on AWS Lambda.](https://github.com/MoveOnOrg/Spoke/blob/main/docs/DEPLOYING_AWS_LAMBDA.md) 

Additional guidance:
*[Choosing a set-up for production](/EXPLANATION_CHOOSE_A_SETUP.md)
*[How to hire someone to install Spoke](/HOWTO_HIRE_SOMEONE_TO_INSTALL_SPOKE.md)


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
  - [Deploying Minimally](./docs/HOWTO_MINIMALIST_DEPLOY.md)
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


## Big Thanks

Cross-browser Testing Platform and Open Source <3 Provided by [Sauce Labs](https://saucelabs.com).

# License

Spoke is licensed under the MIT license.
