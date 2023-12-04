[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v1.4%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)


# StateVoices Hack-a-thon Branches for Development

This github workflow is designed to secure the successful completion of our technical priorities.

- See our live updates from our Hackathon here on our [project board](https://github.com/orgs/StateVoicesNational/projects/3).
- Register for the [Merge Party Sunday Nov 19, 2023 3pmPST/6pmEST](https://www.mobilize.us/statevoices/event/592881/)

Github Workflow

- `main` - is our branch where our community depends on us to maintain it free of bugs and deprecations.

- `hackathon2023-staging` - is our branch where all passing code is developed during State Voices Hack-a-thon.  This branch will recieve a full QA before being merged to main.

- `hackathon2023-testing` - is our branch where volunteer developers bring together their code for peer-review.

Appreciations:

- ADD DEVELOPER NAMES HERE & GITHUB HANDLES

## Spoke

# StateVoices is the new community steward for Spoke!

On November 19th, the repo Spoke was transfered from MoveOn to StateVoices.

[Join us for the Merge Party for more information.](https://www.mobilize.us/statevoices/event/592881/)

## Spoke History


Spoke is an open source text-distribution tool for organizations to mobilize supporters and members into action. Spoke allows you to upload phone numbers, customize scripts and assign volunteers to communicate with supporters while allowing organizations to manage the process.

Spoke was created by Saikat Chakrabarti and Sheena Pakanati, and is now maintained by MoveOn.org.

The latest version is [13.1.0](https://github.com/StateVoicesNational/Spoke/tree/13.1.0) (see [release notes](https://github.com/StateVoicesNational/Spoke/blob/main/docs/RELEASE_NOTES.md#v1310))


## Setting up Spoke


The easiest way to get started is with Heroku.  You can also learn about Spoke through the [texter](https://youtu.be/EqE1UDvKGco) and [admin](https://youtu.be/PTMykMX8gII) video demos or in the explanation on [how to decide if Spoke is right for you.](/docs/EXPLANATION_DECIDING_ON_SPOKE.md)

For developers, please see our recommendations for [deploying locally for development](/docs/HOWTO_DEVELOPMENT_LOCAL_SETUP.md).

Want to know more?
[Click here to visit the Spoke Documentation microsite!](https://statevoicesnational.github.io/Spoke/)


### Quick Start with Heroku
This version of Spoke suitable for testing and, potentially, for small campaigns. This won't cost any money and will not support production(aka large-scale) usage. It's a great way to practice deploying Spoke or see it in action.  

<a href="https://heroku.com/deploy?template=https://github.com/StateVoicesNational/Spoke/tree/13.1.0">

  <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
</a>

Follow up instructions located [here](/docs/HOWTO_HEROKU_DEPLOY.md).


**NOTE:** You can upgrade this deployment later for use in a production setting, but keep in mind you will need to migrate data from any prior campaigns.  Thus it is best to upgrade before you start any live campaigns.  This will cost ~$75 ($25 dyno + $50 postgres) a month and should be suitable for production level usage for most organizations. We recommend that if you plan to use Spoke at scale that you use [this link to deploy with a production infrastructure from the start!](https://heroku.com/deploy?template=https://github.com/StateVoicesNational/Spoke/tree/heroku-button-paid)

Please let us know if you deployed by filling out this form [here](https://act.moveon.org/survey/tech/)


### Other Options for Production Use

You can also [deploy on AWS Lambda.](docs/HOWTO_DEPLOYING_AWS_LAMBDA.md) which is a lot cheaper than Heroku at scale, but requires considerably more technical knowledge to deploy and maintain. We recommend this option for large scale campaigns with tech resources.

Additional guidance:
- [Choosing a set-up for production](docs/EXPLANATION_CHOOSE_A_SETUP.md)
- [How to hire someone to install Spoke](docs/HOWTO_HIRE_SOMEONE_TO_INSTALL_SPOKE.md)
- [Option for minimalist deployment](docs/HOWTO_MINIMALIST_DEPLOY.md)

# License

Spoke is licensed under the [GPL3 license with a special author attribution requirement](LICENSE).
