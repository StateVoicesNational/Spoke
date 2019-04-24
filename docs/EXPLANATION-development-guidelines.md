# Development Guidelines

This document describes current gotchas in our code base an explains the context
for parts that are evolving in a certain direction (or we *want* to evolve in a certain direction).

See [CONTRIBUTING.md](../CONTRIBUTING.md) and the [README](../README.md) for setup
instructions and an overview about how to help and join in development.

## Documentation Organization

We try to organize documentation in the spirit of this blog post:
  [https://www.divio.com/en/blog/documentation/](https://www.divio.com/en/blog/documentation/)

Generally, label by filename what kind of documentation it is in all-caps, one of:

* Tutorial
* Explanation
* How-to guide
* Reference

## Dependency Management

Spoke uses the [yarn](https://yarnpkg.com) package manager. Please follow their documentation when [adding, upgrading, or removing dependencies](https://yarnpkg.com/en/docs/managing-dependencies).

Yarn also uses a [yarn.lock](https://yarnpkg.com/en/docs/yarn-lock) file to ensure consistent installs across machines. Any changes to `yarn.lock` should be included in your pull request. If merge conflicts arise in `yarn.lock`, yarn should [automatically resolve those conflicts](https://stackoverflow.com/questions/42939113/how-do-you-resolve-git-conflicts-in-yarn-lock) during the next `yarn install`.

## Environment Variables/Configuration

Environment Variables affect how the application is run. We aim to support a
diverse group of organizations and deployment contexts, which means a lot of configuration.

Some important places to update or consider updating when you are creating a new
enviornment variable:

* Documentation: Be sure to update or add your variable to [REFERENCE-environment_variables.md](./REFERENCE-environment_variables.md)
* Make sure the default value will not break the application for users that upgrade from a context before the variable existed.
* Only add to `.env.example` if it's an important variable to know about (e.g. the default value will often be wrong) or the development value will often be different (e.g. a DEBUG_ type variable)
* `src/server/middleware/render-index.js` is important to update if this variable is needed on the client/React side and can't/shouldn't be sent through a GraphQL api/object.  In this case, see the bottom of that file.  Be careful since you are printing the variable in *raw javascript* -- so include a `|| <default>` value within the `${...}` context.
* For any variables that enable features that should not be enabled (for legal reasons) in the United States, always ALSO test for `process.env.NOT_IN_USA` -- this ensures that the code self-documents the context these features will be available (and not available in).


## Understanding DB/.[ORM].(https://stackoverflow.com/questions/1279613/what-is-an-orm-and-where-can-i-learn-more-about-it) calls

###TLDR

* For db calls, generally use knex (`r.knex(<table>)`....) while legacy stuff is `r.table(<table>)`
* Make sure you make queries and code that supports, at least, PostgreSQL and Sqlite.

### RethinkDB legacy => rethink-knex-adapter and Knex

Spoke was originally implemented with a noSQL-style RethinkDB backend.
For scaling, lack of support, and an easier development environment, MoveOn moved the backend to
use Knex.js. However, instead of trying to reimplement all backend calls which would have been
an immense challenge, we implemented a [rethink-knex-adapter](https://github.com/MoveOnOrg/rethink-knex-adapter)

This legacy leaves us with many remnants from the original rethink connector. Some are nice and leverage
some good parts of having an ORM, but some are prone to bugs and can be confusing.

Our long-term goal is to move all queries and changes to knex. But here are some important aspects to the
current layout:

* Models are still defined in RethinkDB style in `src/server/models/`.
  Looking there, you'll note some curious aspects.
  * References to other tables are in the form of `<table>_id` and defined as `requiredString()`. This is because, rethink-knex-adapter switches these types to integers and foreign references automatically, and adapts queries that send strings as IDs to integers.  (Same with primary-key fields, `id`)
  * Any field that is NOT a reference that ends in `_id` should get a `.stopReference()` to stop the auto-conversion described above.
  * When creating or changing a new model, please continue with the above style.
* To see where the database is actually connected, see `src/server/models/thinky.js`.
* Note that it exposes the main Knex.js object (`knex` in their documentation) to `r.knex`, and you should access it there.

### DB Queries

* When you see `r.table(...)...` in the code, that is using the Rethink legacy adapter api.
  `r.knex(...)...` is using standard knex queries.
* Rethink had an object model where you could get an 'instance', modify fields, and then run `instance.save()`.
  You will still see this in some code, and some places, it arguably makes the code more readable.
  If it does NOT make the code more readable, please change it to use `r.knex`!
* When switching between the legacy and knex, be careful about query results meant to get back a single record/value.
  In knex, a good pattern is to use `.first()`
  to make sure you get the first object immediately, instead of needing to access the first result as `queryResult[0]`.
* This is especially unintuitive and error-prone with count. So much so, we ask that you use
  a custom helper method `r.getCount` which will look like this:
  `const actualCountResult = await r.getCount(r.knex(<table>).where(.....))`
  The reason, is that different databases return the key differently in knex (so e.g. in postgres,
  it's 'count' but in sqlite it's 'count(*)'.
* Make sure you make queries and code that supports, at least, PostgreSQL and Sqlite.  For *Date queries* this
  can be tricky.  One successful pattern is to calculate the javascript Date object locally, and then
  query with a greater/less-than, like so:

```
const twoHoursAgo = new Date(new Date() - 1000 * 60 * 60 * 2)
await r.knex('job_request').where({ assigned: true }).where('updated_at', '<', twoHoursAgo)
```
  There are two specific gotchas:
  * Do NOT use knex.insert and instead use `<Model>.save(...)`
    * The reasoning is because sqlite does not support `returning()` as such and
      [knex has inconsistent behavior for returning id values](https://github.com/MoveOnOrg/rethink-knex-adapter/blob/master/models.js#L206-L214).
Sqlite does not support knex's `returning()` method.  This affects running `r.knex.insert(....)`
  * Sqlite does not convert datefields in knex.
    See for example: https://github.com/MoveOnOrg/Spoke/issues/817
    One solution is to use r.table(...).getAll which WILL convert them.
    Otherwise, make sure your code does the conversion when necessary.

### Schema changes

Schema changes should include an addition to `src/migrations/index.js`.  If you create a table, make sure you use
`r.knex.schema.createTableIfNotExists` (see knex documentation and existing examples).

In order to support PostgreSQL and Sqlite, you can define a field as `.json()` when defining it in the
migration, but it should be `type.string()` in its `src/server/models/` definition.

Production instances can disable automatic migrations on startup with environment variable `SUPPRESS_MIGRATIONS`.


## Apollo/GraphQL structure and gotchas

See [EXPLANATION-request-example.md](./EXPLANATION-request-example.md) for a great run-down all the
way through the call stack on the client and server.

See Apollo documentation for more details. Note that Spoke currently runs an older version
(`apollo-client: ^0.4.7` and `apollo-server-express": ^1.2.0`) -- we would like to upgrade, but
this will require coordination and revisions on both the server and client side.

One common change is adding an additional field or value to an existing GraphQl query. Below, with
AdminCampaignEdit.jsx as an example, we'll list the places you may need to add a value.  Let's say
we want to add a value to campaign info for that edit page. We might need to edit any or all of these places:

* At the top of `src/containers/AdminCampaignEdit.jsx` in `campaignInfoFragment`
* ...which is referenced from several places at the bottom of the same file
  inside `mapQueriesToProps` and `mapMutationsToProps` -- note, in most (simpler) containers/components
  on the front-end, it will just be in the bottom map definitions.
  Updating it here means that the client side will now *ask* for that field from the server. If you don't
  include it here, then even if the server *can* get the value, it won't.
* `src/server/api/schema.js` in `input CampaignInput`. If it's a required value for a mutation (and retrieval),
  then it should have an `!`. Note the lack of commas -- these sections are magically converted to objects by
  graphql-tools.
* For new object/input types, if it doesn't directly map to a schema defined in one of the files in `src/server/api`,
  then you may need to definte it in `schema.js` under rootResolvers.  See an example with rootResolvers.Action.
  Model object resolvers are 'auto-generated' by calls with `mapFieldsToModel` which you'll
  see called in files like `src/server/api/campaign.js`
* In `campaign.js` note that you will need to update `type Campaign` above, and possibly lower down in `Campaign: { ...mapFieldsToModel([...` (but only if it's a new field/column on the campaign table.

### Security and Access-control

* Roles are assigned per-organization. Users can be assigned a cross-organizational property called 'superadmin' which is limited for
  actions that could undermine the security of the system or access system-level data.
* Security for top-level graphQL queries are in rootResolvers.RootQuery object in [server/api/schema.js](https://github.com/MoveOnOrg/Spoke/blob/dec93521d54ea46476d2a5c7eb9deeedbd69d53f/src/server/api/schema.js#L1122)
  * These correspond to e.g. getContact or getOrganization, etc
* Mutations and custom queries are inside the method
* Helper functions are in [server/api/errors.js](https://github.com/MoveOnOrg/Spoke/blob/main/src/server/api/errors.js) which should/will be optimized to use cached info, etc.  Each of them will throw an error and therefore cancel the request if the user doesn't have the appropriate access.
  * `authRequired(user)` establishes that the user is not anonymous
  * `accessRequired(user, orgId, role, allowSuperadmin = false)` will require the user to have a certain role or higher.  Pass in `true` to allowSuperadmin if superadmins should be allowed.  Generally they should be allowed to do things, but might as well be explicit.
  * `assignmentRequired(user, assignmentId)` makes sure that the user has the assignment in question
  * `superAdminRequired(user)` requires a super-admin user


## Asynchronous tasks (workers)

Previously a lot of tasks were delegated by default to secondary processes which are generally
described and managed in `src/workers/*`.  This is now more limited in scope -- async on most systems
(when you use the recommended environment variable `JOBS_SAME_PROCESS=1`) will be limited to
loading contacts (possibly 100,000s of rows, so we should avoid blocking the main web process),
and cleanup processes like loading in lost sms messages from an SQS error queue or deleting stalled jobs.

If you create a possibly expensive and long-running task, then it should be defined and dispatched through
code in `src/workers`.  `src/workers/job-processes.js` is generally what starts or polls the process (and
run from either `lambda.js` or e.g. `src/workers/message-sender-01.js`.  The actual process that does the
work should be defined in `src/workers/jobs.js`.


## Scaling concerns and focus

Generally following web-development database best practices like indexing fields that are queried against
should resolve most scaling concerns.

MoveOn and the Spoke project are particularly interested and investing in scaling:

* Simultaneous Texters (10K+ texters, at once)
  * Many web requests querying Texter apis
  * Many incoming and outgoing messages
  * Multiple campaigns (and organizations) running at once.
* Uploading large contact lists (1 million+)

If working in these areas, adding efficiency improvements will be lovingly praised and appreciated,
and changes that slow down these goals will receive more scrutiny.
