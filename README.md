[![Build Status](https://travis-ci.org/MoveOnOrg/Spoke.svg?branch=main)](https://travis-ci.org/MoveOnOrg/Spoke)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v1.4%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)

# Spoke

Spoke is an open source text-distribution tool for organizations to mobilize supporters and members into action. Spoke allows you to upload phone numbers, customize scripts and assign volunteers to communicate with supporters while allowing organizations to manage the process.

Spoke was created by Saikat Chakrabarti and Sheena Pakanati, and is now maintained by MoveOn.org.

The latest version is [9.0](https://github.com/MoveOnOrg/Spoke/tree/v9.0) (see [release notes](https://github.com/MoveOnOrg/Spoke/blob/main/docs/RELEASE_NOTES.md#v90))



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


## Get Started


The easiest way to get started is with Heroku.  You can also learn about Spoke through the [texter](https://youtu.be/EqE1UDvKGco) and [admin](https://youtu.be/PTMykMX8gII) video demos or in the explanation on [how to decide if Spoke is right for you.](/docs/EXPLANATION_DECIDING_ON_SPOKE.md)

For developers, please see our recomendations for [deploying locally for development](/docs/HOWTO_DEVELOPMENT_LOCAL_SETUP.md).



## Quick Start with Heroku
This version of Spoke suitable for testing and, potentially, for small campaigns. This won't cost any money and will not support production usage. It's a great way to practice deploying Spoke or see it in action.  

<a href="https://heroku.com/deploy?template=https://github.com/MoveOnOrg/Spoke/tree/v8.0">

  <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
</a>

Follow up instructions located [here](/docs/HOWTO_HEROKU_DEPLOY.md).


**NOTE:** You can upgrade this deployment later for use in a production (aka large-scale) setting, but keep in mind you will lose the data from any prior campaigns.  Thus it is best to upgrade before you start any live campaigns.  This will cost $75 ($25 dyno + $50 postgres) a month and should be suitable for production level usage for most organizations. Alternatively, you can click [this link to deploy with a production infrastructure from the start!](https://heroku.com/deploy?template=https://github.com/MoveOnOrg/Spoke/tree/heroku-button-paid) 

Please let us know if you deployed by filling out this form [here](https://act.moveon.org/survey/tech/)


## Other Options for Production Use 

You can also [deploy on AWS Lambda.](/docs/HOWTO_DEPLOYING_AWS_LAMBDA.md) 

Additional guidance:
- [Choosing a set-up for production](/docs/EXPLANATION_CHOOSE_A_SETUP.md)
- [How to hire someone to install Spoke](/docs/HOWTO_HIRE_SOMEONE_TO_INSTALL_SPOKE.md)


## More Documentation

Want to know more?
[Click here to visit the Spoke Documentation microsite!](https://github.com/MoveOnOrg/Spoke/tree/main/docs)


## Big Thanks

Cross-browser Testing Platform and Open Source <3 Provided by [Sauce Labs](https://saucelabs.com).

# License

Spoke is licensed under the MIT license.
