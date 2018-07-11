const initialize = async (knex, Promise) => {
  // This object's keys are table names and each key's value is a function that defines that table's schema.
  const buildTableSchema = {
    log: t => {
      t.increments('id').primary()
      t.text('message_sid').notNullable()
      t.text('body')
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    },
    zip_code: t => {
      t.text('zip').notNullable()
      t.text('city').notNullable()
      t.text('state').notNullable()
      t.float('latitude').notNullable()
      t.float('longitude').notNullable()
      t.float('timezone_offset').notNullable()
      t.boolean('has_dst').notNullable()
    },
    message: t => {
      t.increments('id').primary()
      t.text('user_number')
      t.text('contact_number').notNullable()
      t.boolean('is_from_contact').notNullable()
      t.text('text')
      t.text('service_response')
      t.text('assignment_id').notNullable()
      t.text('service')
      t.text('service_id')
      t.enu('send_status', ['QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'ERROR', 'PAUSED', 'NOT_ATTEMPTED']).notNullable()
      t.timestamp('created_at')
      t.timestamp('queued_at')
      t.timestamp('sent_at')
      t.timestamp('service_response_at')
      t.index(['user_number'])
    }
  }

  // For each table defined in the schema object, check if it exists and create it if necessary.
  Object.keys(buildTableSchema).forEach(async tableName => {
    if (!await knex.schema.hasTable(tableName)) {
      // buildTableSchema[tableName] is the function that defines the table's schema. knex.schema.createTable calls it with one argument, the table instance (t).
      await knex.schema.createTable(tableName, buildTableSchema[tableName])
    }
  })
  Promise.resolve()
}

module.exports = {
  up: initialize,
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
