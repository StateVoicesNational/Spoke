# Release Notes

## v1.2

Version 1.2 is our second release since MoveOn has adopted Spoke. We are committed to fixing bugs, adding new features and making this project as nimble as possible. For this release, we've included changes from [GetUp](https://www.getup.org.au/), updated certain dependencies, updated Auth0 integration, added user editing capabilities for texters and admins, added the ability to revisit previous conversations and continued to add outside integration points with outside CRMs. Please continue to add and work on our growing [issues list](https://github.com/MoveOnOrg/Spoke/issues). We have also switched from `master` => `main` as a new naming convention for the most stable branch.

We've worked on a lot, but some critical developments to highlight include:
* Adds dynamic assignment functionality for texters
* Adds user editing capabilities for texters and administrators
* Adds the ability to revisit previous conversations
* Adds support for customized styling for campaigns
* Adds ActionKit integration for event sign up and documentation
* Adds support for multi-media images in outgoing texts (mms)
* Adds support for campaign script editing on live campaigns
* Moved to Prop-Types library, upgraded Webpack and other development dependencies
* Adds Code Climate test integration to monitor test coverage
* Adds opt out count for a campaign to admin dashboard stats
* Adds free Heroku deployment setup

Thanks go to to all our contributors for this release including: [jmcarp](https://github.com/jmcarp), [hiemanshu](https://github.com/hiemanshu), [lperson](https://github.com/lperson), [jamesr2323](https://github.com/jamesr2323), [benmort](https://github.com/benmort), [ben-pr-p](https://github.com/ben-pr-p), [lady3bean](https://github.com/lady3bean), [schuyler1d](https://github.com/schuyler1d), [shakalee14](https://github.com/shakalee14), [sreynen](https://github.com/sreynen), [mathemagica](https://github.com/mathemagica)

## v1.1

Version 1.1 is our first release since MoveOn has been using Spoke successfully in production. We are committed to
making this an open-source project used and developed by the wider progressive tech community to advance our
political goals.  Part of our work has been to make that transparent.  Besides this public repository, please help
with our growing [issues list](https://github.com/MoveOnOrg/Spoke/issues), including those marked `easy`.

But of course, we've also done some actual development work!  We've fixed a ton of bugs, but here are some
highlights for this release:

* Adds a passing test framework
* Resolves many bugs related to saving and updating a Campaign for admins
* Improves the Texter interface (better reply visibility, especially on mobile) along with sending on `<Enter>`
* Adds a [Deploy to Heroku](https://github.com/MoveOnOrg/Spoke#deploy-to-heroku) button for easier first-time deployments
* Documented [how to deploy on Amazon AWS Lambda](https://github.com/MoveOnOrg/Spoke/blob/main/docs/DEPLOYING_AWS_LAMBDA.md)
* Migrated from a RethinkDB backend to a Knex.js backend (we recommend use with postgresql database)
* Improved Spoke's security


Thanks go to to all our contributors including: [anasauce](https://github.com/anasauce), [hiemanshu](https://github.com/hiemanshu), [mathemagica](https://github.com/mathemagica), [sandramchung](https://github.com/sandramchung), [schuyler1d](https://github.com/schuyler1d), [shakalee14](https://github.com/shakalee14), [sreynen](https://github.com/sreynen)
