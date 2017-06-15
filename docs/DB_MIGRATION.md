Plans to swap out rethinkdb with another orm compatible
 with e.g. postgres, etc

* thinky is a Rethink ORM https://github.com/neumino/thinky
* thinky.r (and models.r) is the rethinkdbdash interface
    https://github.com/neumino/rethinkdbdash

## A plan to migrate:

 1. Replace array fields in rethinkdb with something easier to migrate
 2. Implement used r.table() filters in a knex backend
 3. Just swap out the model schema declarations

## Model uses of thinky

```
thinky.createModel
thinky.type
  .object().schema() # all for createModel only
  .string
  .array ( in 
     organization.js for permitted_hours, # actually just two values [start, end]
     message.js for service_messages,
                   #strings
                and service_message_ids
                   #strings

     user-organization.js for roles
        # can just be  ['OWNER', 'ADMIN', 'TEXTER']
     interaction-step.js for answer_options
        # recursive data structure of interaction_step_id
        # used for questionResponses in api/campaign-contact.js
        #      and answerOptions in api/question.js
  .number (only in organization)
  .boolean
```

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