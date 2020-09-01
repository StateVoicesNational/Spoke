# How to Code Review
Thank you for stepping up to code review changes for Spoke! Check out [our developer docs](https://moveonorg.github.io/Spoke/#/EXPLANATION-development-guidelines) for more information about how we write code.
## Pre-Review
- Put your mentor hat on — be respectful and gentle — the Spoke project encourages contributions from beginner-developers, and we want to make their early experiences with open-source contributions as positive as possible. We have a [Code of Conduct](../CODE_OF_CONDUCT.md) that we expect all members of the community to follow, and is especially important in the position of being a reviewer.

- If you are unable to complete a review that you’re tagged in within a [48 hour window](#why-review-quickly), comment to let us know and reassign to another reviewer. For large pull requests that will take longer to review, please comment on the issue with a deadline for yourself to complete the review.

- Check the automatically deployed heroku instance and ensure that the change is present and operates as expected.

## The Review

- Look for blocking characteristics in the code. As you identify what you want to comment on remember to use [kind language and to critique the code rather than the author](#critique-the-code-not-the-author). We’re all a team and we want to affirm the efforts of people contributing. <sup>1</sup>

  - **Functional issues:** Does the code have any bugs in it? Does it do what it says it does? Does it break anything existing?
  - **Edge cases that aren’t covered:** Did the author miss any conditions or use cases?
  - **Code Standards:** are there any patterns being used that go against our code standards? If you’re unsure, check the Code Standards section of this doc and if you think we should add something to that section, make a PR!

- Feel free to also point out suggestions that are subjective. It’s great for PR authors to get feedback that helps them grow as a developer. Don’t, however, let these things block the review. Remember to indicate in the comment that this is your opinion and is non-blocking. <sup>2</sup>

  - **Nits:** Anything small and subjective about code that is outside the domain of the style guide. All nit comments should be prefixed with “Nit:” and should indicate that the feedback is subjective.
    - Example: “Nit: I usually prefer map to foreach in this scenario”

  - **Feedback focused on Refactors:** Do you see something structurally that you would have implemented differently? Feel free to suggest a refactor!
    - Example: “I see what you’re doing here — Have you considered breaking that function into 3 smaller functions? I like that approach because it makes them easier to test since then each function only does one thing each.”

## Review Completion

<i><b>This section only applies to [core contributors](https://github.com/MoveOnOrg/Spoke/wiki/Spoke-Access-Groups#spoke-core-contributors).</b> At this time, only core contributors can approve or request changes on a PR and only members of [Spoke access groups](https://github.com/MoveOnOrg/Spoke/wiki/Spoke-Access-Groups) can label issues and PRs.</i>

- Mark the review as either “Approved” or “Request Changes” based on whether you found characteristics that should block it or not. /All comments of type #1 in this section are blocking, and all comments of type #2 are not blocking.

  - If you are requesting changes, be clear in your comment which changes you would require to unblock a review.

  - When you’re done reviewing, indicate whether or not you QA’d the PR with the Heroku pipeline and if it functions as expected

- Mark with any of the relevant labels:

  - For example: S-needs more tests, S-waiting on author, S-needs testing instructions

## Code Standards

**React**
- N/A (make a PR on this doc if you have thoughts!)

**GraphQL**
- Queries in src/containers should be exported for use in testing (see src/containers/TexterTodoList.jsx and __test__/server/api/campaign.test.js for an example)

- Any GraphQL querying components should be in src/containers.  All non-querying components should be in src/components

- Naive additions to GraphQL can easily cause scaling problems.

  - All changes to GraphQL in the following files should be vetted for efficiency and cacheability TexterTodo.jsx,AssignmentTexterContact.jsx, TexterTodoList.jsx

  - All unused data should be excluded

- Server-side:

  - Every query endpoint MUST have an `await accessRequired(....)`

  - Generally test for a cached version on the object before calling the db. See e.g. src/server/api/campaign.js::Campaign::interactionSteps

  - To load an object by id use **`loaders.*.load`** calls rather than Object.get() or db queries

**DB**
- When trying to query results to get back a single record/value in knex use `.first()`

- Ensure the change supports Postgres *and* SQLite

  - Fields should be `type.string()` in their `src/server/models/` definitions

  - Use `<Model>.save(…)` instead of `knex.insert`

  - Because Sqlite does not convert datefields in knex, use `r.table(…).getAll` which WILL convert them. Otherwise, make sure the code does the ### conversion when necessary.
  - Code uses the custom helper method `r.getCount` which will look like this: `const actualCountResult = await r.getCount(r.knex(<table>).where(…..))`
    - Code uses our date query pattern:
```js
const twoHoursAgo = new Date(new Date() - 1000 * 60 * 60 * 2)
await r.knex(‘job_request’).where({ assigned: true }).where(‘updated_at’, ‘<‘, twoHoursAgo)
```

## Critique the code, not the author

In order to maintain healthy and productive code review culture where reviews feel like constructive feedback rather than personal attacks, always be thoughtful as you write comments. How might this comment feel to read? Are you assuming best intent?

Phrasing comments as questions helps open conversation and demonstrates to an author that you’re assuming best intent. Including one positive remark in your review, is another great way to make the author feel appreciated! <sup>3</sup>

## Why Review Quickly?

Studies indicate that “Contributors who received code reviews within 48 hours on their first bug have an exceptionally high rate of returning and contributing. Contributors who wait longer than 7 days for code review on their first bug have virtually zero percent likelihood of returning.” <sup>4</sup> This is part of how we welcome people to our community and maintain momentum. On top of that, PRs that are left for a long time get stale and then require more work to merge.

## Sources

### Footnotes
1.  [Amiangshu Bosu, Michaela Greiler, and Christian Bird. 2015. “Characteristics of Useful Code Reviews: An Empirical Study at Microsoft.” Institute of Electrical and Electronics Engineers, Microsoft.](http://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/bosu2015useful.pdf) 

2.  [Otaru Babatunde, “Comments during Code Reviews,” @otarutunde, Medium, Jun 6, 2018](https://medium.com/@otarutunde/comments-during-code-reviews-2cb7791e1ac7) 

3.  [Kelly Sutton, “8 Tips for Great Code Reviews,” Kelly Sutton, Oct 8, 2018](https://kellysutton.com/2018/10/08/8-tips-for-great-code-reviews.html) 

4.  [Sumana Harihareswara, “How To Improve Bus Factor In Your Open Source Project,” Cogito, Ergo Sumana, 9 August, 2015](https://www.harihareswara.net/sumana/2015/08/09/0) 

### General
 [Jean-Charles Fabre, “A zen manifesto for effective code reviews,” freeCodeCamp, 2 May, 2019](https://www.freecodecamp.org/news/a-zen-manifesto-for-effective-code-reviews-e30b5c95204a/) 
