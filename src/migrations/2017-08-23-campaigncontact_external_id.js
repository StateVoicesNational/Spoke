import { r } from '../server/models'

async function migrate() {
  await r.knex.schema.alterTable('campaign_contact', (table) => {
    table.string('external_id').nullable().default(null);
  })
  console.log('added external_id column to campaign_contact table')
}

migrate()
