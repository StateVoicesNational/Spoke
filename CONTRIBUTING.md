# Contributing Guidelines

Please help us advance progressive politics and have an impact on a project that touches millions of people and
many important organizations!

## Communication channels

* We generally hang out in the [Progressive Coder Network slack](https://www.progcode.org/) in the `#spoke` channel
  * Please fill out the Join form there, and once you are on-boarded, we can chat live!
* Feel free to [create an issue or comment on an existing issue](https://github.com/MoveOnOrg/Spoke/issues) -- Every time we hear from the outside progressive developer community, we do a little dance.
* We also welcome reaching out on our [MoveOn Spoke interest form](https://act.moveon.org/survey/spoke-project/) with questions, etc.

## Your first code contribution

Generally, the first steps are:

* Fork this repository and clone it locally
* Get a working development environment (see the [README](https://github.com/MoveOnOrg/Spoke/#spoke) and [docs/](https://github.com/MoveOnOrg/Spoke/tree/main/docs))-- reach out through our communication channels (above) if you have issues.

### Picking an issue

* We mark issues that are good first issues with the [`good first issue` tag](https://github.com/MoveOnOrg/Spoke/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22). Most of these are marked `easy`, but if you are a more experienced developer then some are not but it may be *easy for you*!
* Comment on the issue and tell us that you're working on it.
* If you have an idea, then create an issue and if possible discuss with us on slack (see communication channels). If it's a big project, we might try to arrange a call or video chat to make sure we're all on the same page.
* If you reach out to us, on github or slack we'll generally try to respond within 1 business day.  If you haven't heard from us, please ping us again.

### Working on an issue

* Depending on the part of the codebase you are working on read relevant parts of [EXPLANATION-development-guidelines.md](./docs/EXPLANATION-development-guidelines.md) for some context and common gotchas.
* While working on an issue, run existing tests to make sure they still work (`npm test`)
* Please try adding a test, at least for backend changes (We have an [open issue to wire up frontend React testing](https://github.com/MoveOnOrg/Spoke/issues/292))
* Before committing changes, please run `npm run lint` to standardize formatting


### Submitting your Pull Request

* Push your changes to your forked version, and create a Pull Request on GitHub for your change
* In the description or title of the pull request, include a reference to the issue that the pull request relates to
* If you are a junior developer, please don't be concerned about the code quality -- we will work with you if there are issues. We are super-excited to help junior developers submit and merge a first pull request.  If you have done some work and tests aren't passing, you can still feel free to submit it, and just comment on the issue that you are having trouble, and we'll work together to fix it.
* Pull Requests sometimes take a bit of time to review or comment on. We will try to respond within 1-3 business days (sometimes we are busy fighting the good fight!)

### Release Process

This describes MoveOn's internal regression testing and release process, and can be used as an example of how another organization could set up a release process for Spoke.

As an organization starts using complex software at scale, it becomes increasingly important to avoid production outages and scaling issues when possible. As MoveOn transitioned into a production software development stage with Spoke, instead of just rolling out changes when they became ready, we decided to adopt a more formal and careful process.

We're a small team, practice agile software development, and plan weekly sprints starting every Monday. For us, it makes sense to do weekly releases of production software. We deploy changes every Wednesday afternoon.

The actual process:
* On Tuesday, we delete the old stage-main branch, and cut a new one from main: 
  * git checkout main
  * git branch -D stage-main
  * git push origin :stage-main
  * git checkout -b stage-main
  * git push origin stage-main
* On Tuesday we will test each PR and only merge it to stage-main and NOT main. We wait to merge to main only after Wednesday's regression 'testing party'
  * This ensures that PRs will not contain anything that breaks deployment and also will allow us to see if any PRs negatively interact with each other before they end up merged to main.  Why bother with this step? it's helpful to have a separate "release candidate" on the stage-main branch because in earlier testing rounds people weren't sure what had been deployed to staging and having a separate branch makes this explicit and clear.
  * When you have tested a PR branch locally and approve its merge (you do NOT click the 'merge' button in github -- that would merge to main (BAD!)). Instead:
  * if this is a different person that created stage-main above, they should run:
    * git fetch
    * git checkout stage-main
    * git reset --hard origin/stage-main
  * Then deploy the stage-main branch to our staging environment
* By EOD Tuesday, we should have reviewed and merged the PRs to stage-main that contain changes we would like to test on staging and roll to prod Wednesday.
* On Wednesday morning, the whole team then piles onto regression testing staging
* After the tech team tests staging, we get at least one member of the Mobile team to signoff on the state of staging.
* If we fix all issues, regression test staging, and tech and mobile have signed off on staging, we merge stage-main back into main, roll to prod, as early as signoff is possible and at latest Thursday morning. This way, we know that the main branch is stable and is what we're running in our prod env.
* After we roll to prod, at least one member of the Tech and Mobile team verify that prod is up and working.
* We never roll code directly to prod without first testing on staging.
