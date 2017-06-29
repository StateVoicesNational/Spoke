Plans to swap out rethinkdb with another orm compatible
 with e.g. postgres, etc

* thinky is a Rethink ORM https://github.com/neumino/thinky
* thinky.r (and models.r) is the rethinkdbdash interface
    https://github.com/neumino/rethinkdbdash

## A plan to migrate:

 1. Replace array fields in rethinkdb with something easier to migrate
 2. Make 'object' fields just JSON-dumped text fields
 2. Implement used r.table() filters in a knex backend
 3. Just swap out the model schema declarations

## Custom model options incompatible with RDBMS

thinky.type

###  .object() # mostly for createModel

 - [ ] campaign-contact.js: custom_fields
          current features can just be json -- might be worth allowing jsonb in postgres
 - [ ] job-request.js: payload
          api/campaign.js filters by payload.id: campaign.id
          so maybe split out id to another field
          ../workers/job-handler.js
          ../workers/lib.js
          the rest can be JSON
 - [X] organization.js: texting_hours_settings
          does not need to be separate from org -- no abstraction beyond org
          pending-message-part.js: service_message
          see array of same kind of stuff.
          maybe all of this should be in redis instead?

### .array

 - [X] organization.js
          for permitted_hours, # actually just two values [start, end]
          features: just has 'one feature' = 'threeClick'
             let's make it a string since it's tested vs. filtered
 - [ ] message.js for service_messages,
                     #strings (or objects?)
                  and service_message_ids
                     #strings

 - [X] user-organization.js for roles
         # can just be  ['OWNER', 'ADMIN', 'TEXTER']
 - [ ] interaction-step.js for answer_options
         # recursive data structure of interaction_step_id
         # used for questionResponses in api/campaign-contact.js
         #      and answerOptions in api/question.js

### compatible types (including from `models/custom-types.js`)
 *  .string, requiredString(), optionalString()
 *  .number (only in organization)
 *  .boolean
 *  timestamp()


## Methods on r. in src/server/api/

```
r.table(<tablename>).
  getAll
  filter((row) => r.and()... row('right')('is_started').eq(true)
  delete
  forEach
  get
  desc # descending
  orderBy
  eqJoin('user_id', r.table('user'))('right')
  limit(1)
r.and
```

graphql is for api interaction/enforcement

## looking at ground-control for inspiration

https://github.com/Bernie-2016/ground-control

* uses knex as ORM
* `knex.select('*').from('users').join('accounts', {'accounts.id': 'users.account_id'})`