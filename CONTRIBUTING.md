# Contributing Guidelines

Please help us advance progressive politics and have an impact on a project that touches millions of people and
many important organizations!

## Communication channels

* We generally hang out in the [Progressive Coder Network slack](https://www.progcode.org/) in the `#spoke` channel
  * Please fill out the Join form there, and once you are on-boarded, we can chat live!
  * ProgCode has community guidelines
* Feel free to [create an issue or comment on an existing issue](https://github.com/spokecommunity/Spoke/issues) -- Every time we hear from the outside progressive developer community, we do a little dance.

Our [contributor Code of Conduct](./code-of-conduct.md) is based on the [Contributor Covenant](https://www.contributor-covenant.org/) and governs all interactions between contributors and potential contributors. Please read it and let us know if you have questions or want to report a violation. We take reports seriously and will never retaliate against someone for reporting.

We are a community of campaigns, staffed organizations, and
volunteers. We affirm our love and support for our volunteers and
recognize that they are carving out valuable time from their friends,
families and paid work to help this project. Just like all open-source
projects, we should come to this project without demands or anger, but
gratitude and appreciation of everyone's time and work.

## Your first code contribution

Generally, the first steps are:

* Fork this repository and clone it locally. Note that unlike the git default, our main branch is called `main`.
* Get a working development environment (see the [README](https://github.com/spokecommunity/Spoke/#spoke) and [docs/](https://github.com/spokecommunity/Spoke/tree/main/docs))-- reach out through our communication channels (above) if you have issues.

### Picking an issue

* We mark issues that are good first issues with the [`good first issue` tag](https://github.com/spokecommunity/Spoke/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22). Most of these are marked `easy`, but if you are a more experienced developer then some are not but it may be *easy for you*!
* Comment on the issue and tell us that you're working on it.
* If you have an idea, then create an issue and if possible discuss with us on slack (see communication channels). If it's a big project, we might try to arrange a call or video chat to make sure we're all on the same page.
* If you reach out to us, on github or slack we'll generally try to respond within 1 business day.  If you haven't heard from us, please ping us again.

### Working on an issue

* Depending on the part of the codebase you are working on read relevant parts of [EXPLANATION-development-guidelines.md](./docs/EXPLANATION-development-guidelines.md) for some context and common gotchas.
* While working on an issue, run existing tests to make sure they still work (`npm test` or `npm run test-sqlite` depending on your backend)
* Please try adding a test, at least for backend changes (We have an [open issue to wire up frontend React testing](https://github.com/MoveOnOrg/Spoke/issues/292))
* Before committing changes, please run `npm run lint` to standardize formatting


### Submitting your Pull Request

* Push your changes to your forked version (or to a new branch on this repo if you're a maintainer), and create a Pull Request on GitHub for your change
* In the description or title of the pull request, include a reference to the issue that the pull request relates to
* If you are a junior developer, please don't be concerned about the code quality -- we will work with you if there are issues. We are super-excited to help junior developers submit and merge a first pull request.  If you have done some work and tests aren't passing, you can still feel free to submit it, and just comment on the issue that you are having trouble, and we'll work together to fix it.
* We will try to respond within 1-3 business days.
