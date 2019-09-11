# Contributing Guidelines

Please help us advance progressive politics and have an impact on a project that touches millions of people and
many important organizations!

## Communication channels

* We generally hang out in the [Progressive Coder Network slack](https://www.progcode.org/) in the `#spoke` channel
  * Please fill out the Join form there, and once you are on-boarded, we can chat live!
  * ProgCode has community guidelines
* Feel free to [create an issue or comment on an existing issue](https://github.com/MoveOnOrg/Spoke/issues) -- Every time we hear from the outside progressive developer community, we do a little dance.
* We also welcome reaching out on our [MoveOn Spoke interest form](https://act.moveon.org/survey/spoke-project/) with questions, etc.

In all forums we affirm the [Progressive Coder Community Guidelines](https://docs.google.com/document/d/1coMHvuGf6x6Qn_73SEhOXi_QaoRBM__3Zj6_5TyrmWs/edit#heading=h.ab96v3qhdgk9)

We are a community of campaigns, staffed organizations, and
volunteers. We affirm our love and support for our volunteers and
recognize that they are carving out valuable time from their friends,
families and paid work to help this project. Just like all open-source
projects, we should come to this project without demands or anger, but
gratitude and appreciation of everyone's time and work.

## Your first code contribution

Generally, the first steps are:

* Fork this repository and clone it locally. Note that unlike the git default, our main branch is called `main`.
* Get a working development environment (see the [README](https://github.com/MoveOnOrg/Spoke/#spoke) and [docs/](https://github.com/MoveOnOrg/Spoke/tree/main/docs))-- reach out through our communication channels (above) if you have issues.

### Picking an issue

* We mark issues that are good first issues with the [`good first issue` tag](https://github.com/MoveOnOrg/Spoke/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22). Most of these are marked `easy`, but if you are a more experienced developer then some are not but it may be *easy for you*!
* Comment on the issue and tell us that you're working on it.
* If you have an idea, then create an issue and if possible discuss with us on slack (see communication channels). If it's a big project, we might try to arrange a call or video chat to make sure we're all on the same page.
* If you reach out to us, on github or slack we'll generally try to respond within 1 business day.  If you haven't heard from us, please ping us again.

### Working on an issue

* Depending on the part of the codebase you are working on read relevant parts of [EXPLANATION-development-guidelines.md](./docs/EXPLANATION-development-guidelines.md) for some context and common gotchas.
* While working on an issue, run existing tests to make sure they still work (`npm test` or `npm run test-sqlite` depending on your backend)
* Please try adding a test, at least for backend changes (We have an [open issue to wire up frontend React testing](https://github.com/MoveOnOrg/Spoke/issues/292))
* Before committing changes, please run `npm run lint` to standardize formatting


### Submitting your Pull Request

* Push your changes to your forked version, and create a Pull Request on GitHub for your change
* Each pull request creates an automatic template to follow - so please follow the template when submitting your work.
* If you are a junior developer, please don't be concerned about the code quality -- we will work with you if there are issues. We are super-excited to help junior developers submit and merge a first pull request.  If you have done some work and tests aren't passing, you can still feel free to submit it, and just comment on the issue that you are having trouble, and we'll work together to fix it.
* Pull Requests sometimes take a bit of time to review or comment on. We will try to respond within 1-3 business days (sometimes we are busy fighting the good fight!)
* Try to keep your changes under 300 lines of code. Studies show that people can't review changesets longer than that without missing things. If your change ends up longer than 300 lines, try breaking up it into smaller chunks and submitting those as separate pull requests.

### Release Process

This describes MoveOn's internal regression testing and release process, and can be used as an example of how another organization could set up a release process for Spoke.

As an organization starts using complex software at scale, it becomes increasingly important to avoid production outages and scaling issues when possible. As MoveOn transitioned into a production software development stage with Spoke, instead of just rolling out changes when they became ready, we decided to adopt a more formal and careful process.

The actual process:
* We create a new stage-main branch at least twice a month:
  * The stage-main branch includes the latest approved pull requests in one merged branch
      * This ensures that PRs will not contain anything that breaks deployment and also will allow us to see if any PRs negatively interact with each other before they end up merged to main.  Why bother with this step? it's helpful to have a separate "release candidate" on the stage-main branch because in earlier testing rounds people weren't sure what had been deployed to staging and having a separate branch makes this explicit and clear.
  * After stage-main is created, we deploy it to MoveOn's staging instance. We have a small set of QA volunteers who then run through a list of [QA steps](https://github.com/MoveOnOrg/Spoke/blob/main/docs/QA_GUIDE.md) in order to find bugs and test new features.
  * After QA is completed, and volunteers haven't identified any bugs, we deploy stage-main to production.
  * We let stage-main run in production for at least a day, before merging stage-main into the main branch.
  * We never roll code directly to prod without first testing on staging.
