import { r } from '../server/models'

// Run with ./dev-tools/babel-run-with-env.js ./src/migrations/2017-08-22-interaction_step_actions.js

async function migrate() {
  await r.knex.schema.alterTable('interaction_step', (table) => {
    table.text('answer_actions');
  })
  console.log('added answer_actions column to interaction_step table')
}

migrate()
