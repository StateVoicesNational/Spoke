const initialize = async (knex, Promise) => {
  // This object's keys are table names and each key's value is a function that defines that table's schema.
  const buildTableSchema = [
    {
      tableName: 'user',
      create: t => {
        t.increments('id').primary()
        t.text('auth0_id').notNullable()
        t.text('first_name').notNullable()
        t.text('last_name').notNullable()
        t.text('cell').notNullable()
        t.text('email').notNullable()
        t.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
        t.text('assigned_cell')
        t.boolean('is_superadmin')
        t.boolean('terms').defaultTo(false)
      }
    },
    {
      tableName: 'pending_message_part',
      create: t => {
        t.increments('id').primary()
        t.text('service').notNullable()
        t.text('service_id').notNullable()
        t.text('parent_id').defaultTo('')
        t.text('service_message').notNullable()
        t.text('user_number').notNullable().defaultTo('')
        t.text('contact_number').notNullable()
        t.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
      }
    },
    {
      tableName: 'organization',
      create: t => {
        t.increments('id')
        t.text('uuid')
        t.text('name').notNullable()
        t.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
        t.text('features').defaultTo('')
        t.boolean('texting_hours_enforced').defaultTo(false)
        t.integer('texting_hours_start').defaultTo(9)
        t.integer('texting_hours_end').defaultTo(21)
      }
    },
    {
      tableName: 'campaign',
      create: t => {
        t.increments('id')
        t.integer('organization_id').notNullable()
        t.text('title').notNullable().defaultTo('')
        t.text('description').notNullable().defaultTo('')
        t.boolean('is_started')
        t.timestamp('due_by').defaultTo(null)
        t.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
        t.boolean('is_archived')
        t.boolean('use_dynamic_assignment')
        t.text('logo_image_url')
        t.text('intro_html')
        t.text('primary_color')

        t.index('organization_id')
        t.foreign('organization_id').references('organization.id')
      }
    },
    {
      tableName: 'assignment',
      create: t => {
        t.increments('id')
        t.integer('user_id').notNullable()
        t.integer('campaign_id').notNullable()
        t.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
        t.integer('max_contacts')

        t.foreign('user_id').references('user.id')
        t.foreign('campaign_id').references('campaign.id')
      }
    },
    {
      tableName: 'campaign_contact',
      create: t => {
        t.increments('id')
        t.integer('campaign_id').notNullable()
        t.integer('assignment_id')
        t.text('external_id').notNullable().defaultTo('')
        t.text('first_name').notNullable().defaultTo('')
        t.text('last_name').notNullable().defaultTo('')
        t.text('cell').notNullable()
        t.text('zip').defaultTo('').notNullable()
        t.text('custom_fields').notNullable().defaultTo('{}')
        t.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
        t.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable()
        t.enu('message_status', [
          'needsMessage',
          'needsResponse',
          'convo',
          'messaged',
          'closed',
          'UPDATING'
        ])
        .defaultTo('needsMessage')
        .notNullable()
        t.boolean('is_opted_out').defaultTo(false)
        t.text('timezone_offset').defaultTo('')

        t.index('assignment_id')
        t.foreign('assignment_id').references('assignment.id')
        t.index('campaign_id')
        t.foreign('campaign_id').references('campaign.id')
        t.index('cell')
        t.index(['campaign_id, assignment_id'], 'campaign_assignment')
        t.index(['assignment_id', 'timezone_offset'], 'assignment_timezone_offset')
      }
    },
    {
      tableName: 'interaction_step',
      create: t => {
        t.increments('id')
        t.integer('campaign_id').notNullable()
        t.text('question').notNullable().defaultTo('')
        t.text('script').notNullable().defaultTo('')
        t.timestamp('created_at').notNullable().defaultTo(knex.fn.now())

        // FIELDS FOR SUB-INTERACTIONS (only):
        t.integer('parent_interaction_id')
        t.text('answer_option').notNullable().defaultTo('')
        t.text('answer_actions').notNullable().defaultTo('')
        t.boolean('is_deleted').defaultTo(false).notNullable()
        t.text('source')
        t.text('external_question_id')
        t.text('external_response_id')

        t.index('parent_interaction_id')
        t.foreign('parent_interaction_id').references('interaction_step.id')
        t.index('campaign_id')
        t.foreign('campaign_id').references('campaign.id')
      }
    },
    {
      tableName: 'log',
      create: t => {
        t.increments('id').primary()
        t.text('message_sid').notNullable()
        t.text('body')
        t.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
      }
    },
    {
      tableName: 'zip_code',
      create: t => {
        t.text('zip').notNullable()
        t.text('city').notNullable()
        t.text('state').notNullable()
        t.float('latitude').notNullable()
        t.float('longitude').notNullable()
        t.float('timezone_offset').notNullable()
        t.boolean('has_dst').notNullable()
      }
    },
    {
      tableName: 'message',
      create: t => {
        t.increments('id').primary()
        t.text('user_number').notNullable().defaultTo('')
        t.text('contact_number').notNullable()
        t.boolean('is_from_contact').notNullable()
        t.text('text').notNullable().defaultTo('')
        t.text('service_response').notNullable().defaultTo('')
        t.integer('assignment_id').notNullable()
        t.text('service').notNullable().defaultTo('')
        t.text('service_id').notNullable().defaultTo('')
        t.enu('send_status', ['QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'ERROR', 'PAUSED', 'NOT_ATTEMPTED']).notNullable()
        t.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
        t.timestamp('queued_at').defaultTo(knex.fn.now()).notNullable()
        t.timestamp('sent_at').defaultTo(knex.fn.now()).notNullable()
        t.timestamp('service_response_at').defaultTo(knex.fn.now()).notNullable()

        // TODO verify these
        t.index(['user_number', 'send_status', 'user_number', 'contact_number', 'service_id'])
      }
    },
    {
      tableName: 'user_cell',
      create: t => {
        t.increments('id').primary()
        t.text('cell').notNullable()
        t.integer('user_id').notNullable()
        t.enu('service', ['nexmo', 'twilio'])
        t.boolean('is_primary')

        // TODO verify
        t.index(['user_id'])
        t.foreign('user_id').references('user.id')
      }
    }
  ]

  // For each table in the schema array, check if it exists and create it if necessary.
  buildTableSchema.forEach(async ({ tableName, create }) => {
    if (!await knex.schema.hasTable(tableName)) {
      // create is the function that defines the table's schema. knex.schema.createTable calls it with one argument, the table instance (t).
      await knex.schema.createTable(tableName, create)
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
This table ordering is taken from __test__/test_helpers.js. Go from the bottom up.
  - log
  - zip_code
  - message
  - user_cell
  - user_organization
  - canned_response
  - invite
  - job_request
  - migrations
  - opt_out
  - question_response
  - interaction_step
  - campaign_contact
  - assignment
  - campaign
  - organization
  - pending_message_part
  - user
*/
