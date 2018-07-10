module.exports = {
  up: (knex, Promise) => {
    // define the log table
    knex.schema.createTableIfNotExists('log', t => {
      t.string('id')
      t.string.notNullable('message_sid')
      t.string('body')
      t.timestamp('created_at')
    })
  },
  down: (knex, Promise) => {
    Promise.resolve()
  }
}
/*
This table ordering is taken from __test__/test_helpers.js

await r.knex.schema.dropTableIfExists('log')
await r.knex.schema.dropTableIfExists('zip_code')
await r.knex.schema.dropTableIfExists('message')
await r.knex.schema.dropTableIfExists('user_cell')
await r.knex.schema.dropTableIfExists('user_organization')
await r.knex.schema.dropTableIfExists('canned_response')
await r.knex.schema.dropTableIfExists('invite')
await r.knex.schema.dropTableIfExists('job_request')
await r.knex.schema.dropTableIfExists('migrations')
await r.knex.schema.dropTableIfExists('opt_out')
await r.knex.schema.dropTableIfExists('question_response')
await r.knex.schema.dropTableIfExists('interaction_step')
await r.knex.schema.dropTableIfExists('campaign_contact')
await r.knex.schema.dropTableIfExists('assignment')
await r.knex.schema.dropTableIfExists('campaign')
await r.knex.schema.dropTableIfExists('organization')
await r.knex.schema.dropTableIfExists('pending_message_part')
await r.knex.schema.dropTableIfExists('user')

*/
