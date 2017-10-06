# Release Notes

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
* Documented [how to deploy on Amazon AWS Lambda](https://github.com/MoveOnOrg/Spoke/blob/master/docs/DEPLOYING_AWS_LAMBDA.md)
* Migrated from a RethinkDB backend to a Knex.js backend (we recommend use with postgresql database)
* Improved Spoke's security

