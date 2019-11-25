# Release Notes
## v3.2

_November 2019:_ Version 3.2.0

This release includes the following improvements:

- Fixed bug that was not allowing texts to be reassigned in message review
- Multiple documentation fixes and copy adjustments in the UI
- Fixes bug that made deployment fail for AWS Lambda
- Adds redis into the testing suite for more reliable tests

Thanks to all the contributors apart of this release including:
[stevenfranks](https://github.com/stevenfranks),
[ibrand](https://github.com/ibrand),
[lperson](https://github.com/lperson),
[schuyler1d](https://github.com/schuyler1d),
[zhaluza](https://github.com/zhaluza),
[WSINTRA](https://github.com/WSINTRA)
[joemcl](https://github.com/joemcl)

## v3.1

_September 2019:_ Version 3.1.0

This release includes the following improvements:

- Adds prettier as a way to encourage code consistency across the project
- Adds documentation for our Code of Conduct
- Fixes some bugs around copying campaigns
- Fixes bugs for new instances deployed to Heroku

Thanks to all the contributors apart of this release including:
[filafb](https://github.com/filafb),
[ibrand](https://github.com/ibrand),
[lperson](https://github.com/lperson),
[schuyler1d](https://github.com/schuyler1d),
[shakalee14](https://github.com/shakalee14),
[strangeways](https://github.com/strangeways)

## v3.0

_August 2019:_ Version 3.0.0

This release includes the following improvements:

- Knex Migration Configuration (see note below)
- An upgrade to Node 10
- A new feature - Google Doc Imports for Interactions / Campaign Scripts
- Additions to the caching layer
- More texter tests
- Improvements and standardization on the developer experience
- Improvements in documentation, including the README.md
- Addition of a favicon
- Adding automatic capitalization to new user names
- New Upland Mobile Commons Action Handler / Integration with documentation
- New documentation "how to" guide for deciding to adopt Spoke

Note on Knex Migration:
Anyone that is upgrading from a version released earlier than March 2018 should see this issue comment:
https://github.com/MoveOnOrg/Spoke/pull/1154#issuecomment-510163604

Thanks to all the contributors apart of this release including:
[AnuradhaNaik](https://github.com/AnuradhaNaik),
[azuzunaga](https://github.com/azuzunaga),
[filafb](https://github.com/filafb),
[harpojaeger](https://github.com/harpojaeger),
[ibrand](https://github.com/ibrand),
[joemcl](https://github.com/joemcl),
[lperson](https://github.com/lperson),
[mathemagica](https://github.com/mathemagica),
[rcackermanCC](https://github.com/rcackermanCC),
[schuyler1d](https://github.com/schuyler1d),
[shakalee14](https://github.com/shakalee14)

## v2.0

_April 2019:_ Version 2.0.0

This release includes an improvement to message sending speeds, many usability improvements to the Admin Message Review panel, bug fixes for different features, improved data warehouse querying for audiences, Docker support/documentation, Local Authentication, etc. We also have switched to using `yarn` dev and install commands versus `npm`. To see an updated feature list, please visit opensource.moveon.org/spoke.

Migrations:

- Texting hour related columns to the `Campaign` table.
- Send_before column to the `Message` table.
- Creator_id column to the `Campaign` table.

Heroku:

The Heroku deployment method has been migrated to the container runtime. When upgrading an existing Heroku app, these [migration steps](https://github.com/MoveOnOrg/Spoke/blob/33e2edcc455836f36eafd56d585430ac1ceda515/docs/HOWTO_HEROKU_DEPLOY.md#upgrading-an-existing-heroku-app) will need to be performed.

Lambda:

This version includes an update for the Node runtime environment. For current AWS Lambda Users - you can update your Node runtime to 8.10 by either visiting the `Function code` Section and moving the drop down to 8.10 or by running the following script: `claudia update --runtime nodejs8.10`. For new Lambda deployments, Claudia.js will default to Node 8.10.

Thanks to all the contributors apart of this release including:
[anasauceda](https://github.com/anasauceda),
[azuzunaga](https://github.com/azuzunaga),
[bchrobot](https://github.com/bchrobot),
[benhiller](https://github.com/benhiller),
[harpojaeger](https://github.com/harpojaeger),
[jlegrone](https://github.com/jlegrone),
[joemcl](https://github.com/joemcl),
[jparkrr](https://github.com/jparkrr),
[lperson](https://github.com/lperson),
[sandramchung](https://github.com/sandramchung),
[schuyler1d](https://github.com/schuyler1d),
[shakalee14](https://github.com/shakalee14)

## v1.4.1

_August 2018:_ Version 1.4.1

- This version fixes bugs found in 1.4 including a deployment bug.

## v1.4

This release includes many optimizations, new features and more tests! We've fixed outstanding bugs, added more administrative functionality and worked on the texter experience. We've also introduced a new testing suite and redis caching capabilities. Over the next couple months, we intend to add more testing and continue to work on scaling.

Note - we will have a new release in the next few weeks and switch to a shorter release cycle in the next few months. Please upgrade your instance and let us know if you find any bugs or have questions!

_July 2018:_ Version 1.4

- A 'Skipped Messages' section for texters to allow access to previously skipped conversations. Skipped conversations can be 'reopened' and filter back into the 'replies' view.
- A 'Message Review' board for administrators to allow message reassignment to different texters. Administrators also have the ability to see more incoming messages than previous.
- The ability to mark contacts as opted out without sending a message.
- Selenium end to end testing with Sauce Labs integration.
- Redis caching capabilities including caching user's authentication status.
- Updates to documentation for AK integration, popular queries, and email and data exporting integration.
- Bug fixes around owner, admin and superadmin permissions when attempting to text, timezone handling, permission issues on admin dashboard.
- Update to our community guidelines.

Thanks go to all our contributors for this release including:
[azuzunaga](https://github.com/azuzunaga),
[bchrobot](https://github.com/bchrobot),
[bdatkins](https://github.com/bdatkins),
[cp4r3z](https://github.com/cp4r3z),
[codygordon](https://github.com/codygordon),
[eXrump](https://github.com/eXrump),
[harpojaeger](https://github.com/harpojaeger),
[joemcl](https://github.com/joemcl),
[lperson](https://github.com/lperson),
[mathemagica](https://github.com/mathemagica),
[shakalee14](https://github.com/shakalee14)

## v1.3

Two major themes that we are focusing on this year are improving
integrations and scaling. This release begins that work with support
for MailGun notifications and Revere subscriptions. In order to scale
work-flows, we have added a new SuperVolunteer position and now allow
texters to update their own information.

Over the next couple months, we intend to integrate with more outside
systems and we will also be adding significant work
around scaling the system to support much larger volumes and participants.
We will also be continuing to add more automated tests to scale participation.
All of that is to make sure that the growing community can keep adding
enhancements yourself -- please jump in on our issues page to either
implement something or file an issue on something you want Spoke to do!

Please upgrade your instance and let us know if you encounter any issues!

_April 2018:_ Version 1.3

- A 'Past Messages' section for Texters to allow access to previous conversations before a reply comes back.
  This feature helps cases where someone accidentally clicked a button or wants to follow-up with requested information.
- Texters can update their name, email and other information from the menu.
  Admins can update texter info from the console
- A new SuperVolunteer role, which allows a non-admin to update assignments, and [some other tasks](https://github.com/MoveOnOrg/Spoke/issues/455)
- Added [MailGun support](HOWTO_HEROKU_DEPLOY.md#setting-up-mailgun)
- Frontend React tests!
- Added an action handler to automatically subscribe to a [Revere](https://reverehq.com/)
  SMS list -- see [Revere integration instructions](HOWTO_INTEGRATE_WITH_REVERE.md)
- Fixed some bugs:
  - The texter menu now has a home button
  - The zipcode table was too big to fit in a free Heroku database
  - Some login issues were fixed and documentation was improved
  - Improved contact load times for texter screen

Thanks go to all our contributors for this release including:
[ben-pr-p](https://github.com/ben-pr-p),
[harpojaeger](https://github.com/harpojaeger),
[lperson](https://github.com/lperson),
[shakalee14](https://github.com/shakalee14),
[schuyler1d](https://github.com/schuyler1d),
[zluo16](https://github.com/zluo16),
[jparkrr](https://github.com/jparkrr),
[JeremyParker](https://github.com/JeremyParker),
[hiemanshu](https://github.com/hiemanshu),
[Dayologic](https://github.com/Dayologic),
[hi0ctane](https://github.com/hi0ctane),
[sandramchung](https://github.com/sandramchung),
[sreynen](https://github.com/sreynen),
[mathemagica](https://github.com/mathemagica)

## v1.2

_January 2018:_ Version 1.2 is our second release since MoveOn has adopted Spoke. We are committed to fixing bugs, adding new features and making this project as nimble as possible. For this release, we've included changes from [GetUp](https://www.getup.org.au/), updated certain dependencies, updated Auth0 integration, added user editing capabilities for texters and admins and continued to add outside integration points with outside CRMs. Please continue to add and work on our growing [issues list](https://github.com/MoveOnOrg/Spoke/issues). We have also switched from `master` => `main` as a new naming convention for the most stable/default branch.

We've worked on a lot, but some critical developments to highlight include:

- Adds dynamic assignment functionality for texters
- Adds user editing capabilities for texters and administrators
- Adds support for customized styling for campaigns
- Adds ActionKit integration for event sign up and documentation
- Adds support for multi-media images in outgoing texts (mms)
- Adds support for campaign script editing on live campaigns
- Moved to Prop-Types library, upgraded Webpack and other development dependencies
- Adds Code Climate test integration to monitor test coverage
- Adds opt out count for a campaign to admin dashboard stats
- Adds free Heroku deployment setup
- Adds more automated tests

Thanks go to to all our contributors for this release including: [jmcarp](https://github.com/jmcarp), [hiemanshu](https://github.com/hiemanshu), [lperson](https://github.com/lperson), [jparkrr](https://github.com/jparkrr), [jamesr2323](https://github.com/jamesr2323), [benmort](https://github.com/benmort), [ben-pr-p](https://github.com/ben-pr-p), [lady3bean](https://github.com/lady3bean), [schuyler1d](https://github.com/schuyler1d), [shakalee14](https://github.com/shakalee14), [sreynen](https://github.com/sreynen), [mathemagica](https://github.com/mathemagica)

## v1.1

_October 2017:_ Version 1.1 is our first release since MoveOn has been using Spoke successfully in production. We are committed to
making this an open-source project used and developed by the wider progressive tech community to advance our
political goals. Part of our work has been to make that transparent. Besides this public repository, please help
with our growing [issues list](https://github.com/MoveOnOrg/Spoke/issues), including those marked `easy`.

But of course, we've also done some actual development work! We've fixed a ton of bugs, but here are some
highlights for this release:

- Adds a passing test framework
- Resolves many bugs related to saving and updating a Campaign for admins
- Improves the Texter interface (better reply visibility, especially on mobile) along with sending on `<Enter>`
- Adds a [Deploy to Heroku](https://github.com/MoveOnOrg/Spoke#deploy-to-heroku) button for easier first-time deployments
- Documented [how to deploy on Amazon AWS Lambda](DEPLOYING_AWS_LAMBDA.md)
- Migrated from a RethinkDB backend to a Knex.js backend (we recommend use with postgresql database)
- Improved Spoke's security

Thanks go to to all our contributors including: [anasauce](https://github.com/anasauce), [hiemanshu](https://github.com/hiemanshu), [mathemagica](https://github.com/mathemagica), [sandramchung](https://github.com/sandramchung), [schuyler1d](https://github.com/schuyler1d), [shakalee14](https://github.com/shakalee14), [sreynen](https://github.com/sreynen)
