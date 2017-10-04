import { r, Migrations } from '../server/models'
import { log } from '../lib'

// To add a migrations, add a new migration object to the
// bottom of the migrations array.

const migrations = [
  { auto: true, //0
    date: '2017-08-10',
    migrate: async function() {
      await r.knex.schema.alterTable('organization', (table) => {
        table.string('uuid');
      })
      console.log('added uuid column to organization table')
    }
  },
  { auto: true, //1
    date: '2017-08-22',
    migrate: async function() {
      await r.knex.schema.alterTable('interaction_step', (table) => {
        table.text('answer_actions');
      })
      console.log('added answer_actions column to interaction_step table')
    }
  },
  { auto: true, //2
    date: '2017-08-23',
    migrate: async function migrate() {
      await r.knex.schema.alterTable('campaign_contact', (table) => {
        table.string('external_id').nullable().default(null);
      })
      console.log('added external_id column to campaign_contact table')
    }
  },
  { auto: true, //3
    date: '2017-09-22',
    migrate: async function migrate() {
      await r.knex.schema.alterTable('campaign', (table) => {
        table.boolean('use_dynamic_assignment').notNullable().default(false);
      })
      await r.knex.schema.alterTable('assignment', (table) => {
        table.integer('max_contacts');
      })
      console.log('added dynamic_assigment column to campaign table and max_contacts to assignments')
    }
  },
  { auto: true, //4
    date: '2017-09-25',
    migrate: async function migrate() {
      await r.knex.schema.alterTable('campaign_contact', (table) => {
        table.timestamp('updated_at').default('now()');
      })
      console.log('added updated_at column to campaign_contact')
    }
  },
  { auto: true, //5
    date: '2017-10-03',
    migrate: async function migrate() {
      await r.knex.schema.alterTable('interaction_step', (table) => {
        table.timestamp('is_deleted').notNullable().default(false);
      })
      console.log('added is_deleted column to interaction_step')
    }
  },
  { auto: true, //6
    date: '2017-10-04',
    migrate: async function migrate() {
      await r.knex.schema.alterTable('campaign', (table) => {
        table.text('intro_html');
        table.text('logo_image_url');
        table.string('primary_color');
      })
      console.log('added is_deleted column to interaction_step')
    }
  }
  /* migration template
     {auto: true, //if auto is false, then it will block the migration running automatically
      date: '2017-08-23',
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
    // set the record for what is the current status-quo
    const migrationRecord = await Migrations.save({completed: migrations.length})
    log.info('created Migration record for reference going forward', migrationRecord)
  } else {
    migrationIndex = migrationIndex || exists.completed
    if (migrationIndex < migrations.length) {
      log.info('Migrating database from ', migrationIndex, 'to', migrations.length-1)
      for (let i=migrationIndex,l=migrations.length; i<=l; i++) {
        const migration = migrations[i]
        if (!migration || !migration.auto) {
          break // stop all until the non-auto migration is run
        } else {
          console.log('migrating...')
          await migration.migrate()
          exists.completed = i+1 //length, not index
          await exists.save()
        }
      }
    }
  }
}
