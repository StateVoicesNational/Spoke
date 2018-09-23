import { r, Migrations } from '../server/models'
import { log } from '../lib'

// To add a migrations, add a new migration object to the
// bottom of the migrations array.

const migrations = [
  { auto: true, // 0
    date: '2017-08-10',
    // eslint-disable-next-line
    migrate: async () => {
      await r.knex.schema.alterTable('organization', (table) => {
        table.string('uuid')
      })
      console.log('added uuid column to organization table')
    }
  },
  { auto: true, // 1
    date: '2017-08-22',
    // eslint-disable-next-line
    migrate: async () => {
      await r.knex.schema.alterTable('interaction_step', (table) => {
        table.text('answer_actions')
      })
      console.log('added answer_actions column to interaction_step table')
    }
  },
  { auto: true, // 2
    date: '2017-08-23',
    // eslint-disable-next-line
    migrate: async () => {
      await r.knex.schema.alterTable('campaign_contact', (table) => {
        table.string('external_id').nullable().default(null)
      })
      console.log('added external_id column to campaign_contact table')
    }
  },
  { auto: true, // 3
    date: '2017-09-24',
    // eslint-disable-next-line
    migrate: async () => {
      await r.knex.schema.alterTable('job_request', (table) => {
        table.string('result_message').nullable().default('')
      })
      await r.knex.schema.alterTable('opt_out', (table) => {
        table.string('reason_code').nullable().default('')
      })
    }
  },
  { auto: true, // 4
    date: '2017-09-22',
    migrate: async () => {
      console.log('updating for dynamic assignment (tables campaign, assignment)')
      await r.knex.schema.alterTable('campaign', (table) => {
        table.boolean('use_dynamic_assignment').notNullable().default(false)
      })
      await r.knex.schema.alterTable('assignment', (table) => {
        table.integer('max_contacts')
      })
      console.log('added dynamic_assigment column to campaign table and max_contacts to assignments')
    }
  },
  { auto: true, // 5
    date: '2017-09-25',
    migrate: async () => {
      await r.knex.schema.alterTable('campaign_contact', (table) => {
        table.timestamp('updated_at').default('now()')
      })
      console.log('added updated_at column to campaign_contact')
    }
  },
  { auto: true, // 6
    date: '2017-10-03',
    migrate: async () => {
      await r.knex.schema.alterTable('interaction_step', (table) => {
        console.log('updating interaction_step table')
        table.boolean('is_deleted').notNullable().default(false)
      })
      console.log('added is_deleted column to interaction_step')
    }
  },
  { auto: true, // 7
    date: '2017-10-04',
    migrate: async () => {
      await r.knex.schema.alterTable('campaign', (table) => {
        console.log('updating campaign table')
        table.text('intro_html')
        table.text('logo_image_url')
        table.string('primary_color')
      })
      console.log('added intro_html, logo_image_url, primary_color to campaign')
    }
  },
  { auto: true, // 8
    date: '2017-09-28',
    migrate: async () => {
      console.log('updating user table')
      await r.knex.schema.alterTable('user', (table) => {
        table.boolean('terms').default(false)
      })
      console.log('added terms column to user')
    }
  },
  { auto: true, // 9
    date: '2017-10-23',
    migrate: async () => {
      console.log('updating message table')
      await r.knex.schema.alterTable('message', (table) => {
        table.timestamp('queued_at')
        table.timestamp('sent_at')
        table.timestamp('service_response_at')
      })
      console.log('added action timestamp columns to message')
    }
  },
  { auto: true, // 10
    date: '2017-10-23',
    migrate: async () => {
      console.log('adding log table')
      await r.knex.schema.createTableIfNotExists('log', (table) => {
        table.string('message_sid')
        table.json('body')
        table.timestamp('created_at').default('now()')
      })
      console.log('added log table')
    }
  },
  { auto: true, // 11
    date: '2018-07-16',
    migrate: async () => {
      await r.knex.schema.alterTable('message', (table) => {
        table.integer('user_id')
          .unsigned()
          .nullable()
          .default(null)
          .index()
          .references('id')
          .inTable('user')
      })
      console.log('added user_id column to message table')
    }
  },
  {
    auto: true, // 12
    date: '2018-08-25',
    migrate: async function () {
      console.log('adding texting hours fields to campaign')
      await r.knex.schema.alterTable('campaign', (table) => {
        table.boolean('override_organization_texting_hours').notNullable().default(false)
        table.boolean('texting_hours_enforced').notNullable().default(true)
        table.integer('texting_hours_start').notNullable().default(9)
        table.integer('texting_hours_end').notNullable().default(21)
        table.string('timezone').notNullable().default('US/Eastern')
      })

      console.log('added texting hours fields to campaign')
    }
  },
  {
    auto: true, // 13
    date: '2018-09-22',
    migrate: async () => {
      console.log('creating campaign_contact_tag table')
      await r.knex.schema.createTableIfNotExists('campaign_contact_tag', (table) => {
        table.increments('id').unsigned().primary()
        table.integer('campaign_contact_id').unsigned().notNullable().index().references('id').inTable('campaign_contact')
        table.string('tag', 16).notNullable()
        table.timestamp('created_at').notNullable()
        table.integer('message_id').unsigned().nullable().references('id').inTable('message')
      })
      console.log('created campaign_contact_tag table')
    }
  }
  /* migration template
     {auto: true, //if auto is false, then it will block the migration running automatically
      date: '2017-08-23',
      // eslint-disable-next-line
      migrate: async function() {
        // it is ok if this function fails if run again, but
        // it should be ok to be run twice.  If not, then make auto=false
        await r.knex.schema.alterTable('campaign_contact', (table) => {
          table.string('external_id').nullable().default(null);
        })
        console.log('added external_id column to campaign_contact table')
      }
     }
   */
]

export async function runMigrations(migrationIndex) {
  const exists = await Migrations.getAll().limit(1)(0).default(null)
  if (!exists) {
    // set the record for what is the current status-quo upon original installation
    const migrationRecord = await Migrations.save({ completed: migrations.length })
    log.info('created Migration record for reference going forward', migrationRecord)
  } else {
    const migrationInd = migrationIndex || exists.completed
    if (migrationInd < migrations.length) {
      log.info('Migrating database from ', migrationInd, 'to', migrations.length)
      for (let i = migrationInd, l = migrations.length; i <= l; i++) {
        const migration = migrations[i]
        if (!migration || !migration.auto) {
          break // stop all until the non-auto migration is run
        } else {
          console.log('migrating...')
          await migration.migrate()
          await r.knex('migrations').update({ completed: i + 1 }) // length, not index so +1
        }
      }
    }
  }
}
