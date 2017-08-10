import { r } from '../server/models'

async function migrate() {
  await r.knex.schema.alterTable('organization', (table) => {
    table.string('uuid');
  })
  console.log('added uuid column to organization table')
}

migrate()
