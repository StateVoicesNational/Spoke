# Contributing Guidelines

Please help us advance progressive politics and have an impact on a project that touches millions of people and
many important organizations!

## Communication channels

- We generally hang out in the [Progressive Coder Network slack](https://www.progcode.org/) in the `#spoke` channel
  - Please fill out the Join form there, and once you are on-boarded, we can chat live!
  - ProgCode has community guidelines
- We have a weekly(ish) working group at [Progressive HackNight](https://progressivehacknight.org) that organizes in the #wg-spoke_p2p_sms_tool channel in the slack
- Feel free to [create an issue or comment on an existing issue](https://github.com/MoveOnOrg/Spoke/issues) -- Every time we hear from the outside progressive developer community, we do a little dance.
- We also welcome reaching out on our [MoveOn Spoke interest form](https://act.moveon.org/survey/spoke-project/) with questions, etc.

In all forums we affirm the [Progressive Coder Community Guidelines](https://docs.google.com/document/d/1coMHvuGf6x6Qn_73SEhOXi_QaoRBM__3Zj6_5TyrmWs/edit#heading=h.ab96v3qhdgk9)

We are a community of campaigns, staffed organizations, and
volunteers. We affirm our love and support for our volunteers and
recognize that they are carving out valuable time from their friends,
families and paid work to help this project. Just like all open-source
projects, we should come to this project without demands or anger, but
gratitude and appreciation of everyone's time and work.

## Your first code contribution

Generally, the first steps are:

- Fork this repository and clone it locally. Note that unlike the git default, our main branch is called `main`.
- Get a working development environment (see the [README](https://github.com/MoveOnOrg/Spoke/#spoke) and [docs/](https://github.com/MoveOnOrg/Spoke/tree/main/docs))-- reach out through our communication channels (above) if you have issues.

### Picking an issue

- We mark issues that are good first issues with the [`good first issue` tag](https://github.com/MoveOnOrg/Spoke/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22). We have these set aside for first contributions to make it more accessible to get started.
- Comment on the issue and tell us that you're working on it. Feel free to ask any clarifying questions that you have.
- If you have an idea, then create an issue and if possible discuss with us on slack (see communication channels). If it's a big project, please use the [project proposal template](https://github.com/MoveOnOrg/Spoke/issues/new?assignees=&labels=idea+%28underspec%27d%29&template=architecture-proposal.md&title=RFC%3A+%3Cyour-proposal-title%3E). We might follow up to try to arrange a call or video chat to make sure we're all on the same page.
- If you reach out to us, on github or slack we'll generally try to respond within 1 business day. If you haven't heard from us, please ping us again.

### Working on an issue

- Depending on the part of the codebase you are working on read relevant parts of [EXPLANATION-development-guidelines.md](./docs/EXPLANATION-development-guidelines.md) for some context and common gotchas.
- While working on an issue, run existing tests to make sure they still work (see [How To Run Tests](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO-run_tests.md) documentation).
- Please try adding a test

### Submitting your Pull Request

- Push your changes to your forked version, and create a Pull Request on GitHub for your change
- Each pull request creates an automatic template to follow - so please follow the template when submitting your work.
- If you are a junior developer, please don't be concerned about the code quality -- we will work with you if there are issues. We are super-excited to help junior developers submit and merge a first pull request. If you have done some work and tests aren't passing, you can still feel free to submit it, and just comment on the issue that you are having trouble, and we'll work together to fix it.
- Pull Requests sometimes take a bit of time to review or comment on. We will try to respond within 1-3 business days (sometimes we are busy fighting the good fight!)
- Try to keep your changes under 300 lines of code. Studies show that people can't review changesets longer than that without missing things. If your change ends up longer than 300 lines, try breaking up it into smaller chunks and submitting those as separate pull requests.

## Code contributions going forward
Welcome to the project! Once you've completed that first contribution, there are so many different areas of Spoke that you can jump in to work on and it can be  overwhelming to know how to continue your journey.

### Finding issues
- All issues that are up for grabs and mostly (if not fully) planned are listed under the [help wanted](https://github.com/MoveOnOrg/Spoke/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22) label. This is a great place to start if you don't feel attached to any particular issue and just want to keep helping out.
- We use our [Area labels](docs/EXPLANATION-labels.md) to categorize issues into which code feature areas they belong in. Feel free to sort by an area you're interested in.
- We use our [Organization labels](docs/EXPLANATION-labels.md) to categorize issues by which organizations are prioritizing them. You can sort by your favorite org and help out there.
- More broadly, there are all sort of different [labels](https://github.com/MoveOnOrg/Spoke/labels) we use to filter the issues down and you can leverage that to help you find work.
- Lastly, you can always ping a project maintainer (@ibrand, and @schuyler1d) to get a read on what's on our radar right now.

### Claiming issues
- Like for your first issue, comment on the issue and tell us that you're working on it. Feel free to ask any clarifying questions that you have.
- Because you've contributed before, if you accept a read-only invite to the repo, you can be assigned directly to the issue to help us keep an eye on it.

### Working on an issue
- Provide updates as you move through the process.
- If you can't finish an issue, let us know and provide as much of your WIP as you can so that someone else can take that work to the finish line!
- Community members are friendly and happy to answer code questions you have.
- Remember to write tests with your contribution!

### Becoming a regular
Spoke has a concept of [Access Groups](https://github.com/MoveOnOrg/Spoke/wiki/Spoke-Access-Groups) meant to give extra repo privileges to recurring contributors. Access Groups honor community members who are contributing through their issue authorship and also those who contribute code. If you continue to contribute to Spoke, there are pathways towards larger projects and community involvement.

### Release Process

This describes MoveOn's internal regression testing and release process, and can be used as an example of how another organization could set up a release process for Spoke.

As an organization starts using complex software at scale, it becomes increasingly important to avoid production outages and scaling issues when possible. As MoveOn transitioned into a production software development stage with Spoke, instead of just rolling out changes when they became ready, we decided to adopt a more formal and careful process.

The actual process:

- We create a new stage-main branch at least twice a month:
  - The stage-main branch includes the latest approved pull requests in one merged branch
    - This ensures that PRs will not contain anything that breaks deployment and also will allow us to see if any PRs negatively interact with each other before they end up merged to main. Why bother with this step? It's helpful to have a separate "release candidate" on the stage-main branch because in earlier testing rounds people weren't sure what had been deployed to staging and having a separate branch makes this explicit and clear.
  - After stage-main is created, we deploy it to MoveOn's staging instance. We have a small set of QA volunteers who then run through a list of [QA steps](https://github.com/MoveOnOrg/Spoke/blob/main/docs/QA_GUIDE.md) in order to find bugs and test new features.
  - After QA is completed, and volunteers haven't identified any bugs, we deploy stage-main to production.
  - We let stage-main run in production for at least a day, before merging stage-main into the main branch.
  - We never roll code directly to prod without first testing on staging.
