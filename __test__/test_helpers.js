import { createLoaders, r } from '../src/server/models/'

async function clearTestData() {
  // Drop tables in an order that drops foreign keys before dependencies
  await r.knex.schema.dropTable('zip_code')
  await r.knex.schema.dropTable('user_organization')
  await r.knex.schema.dropTable('canned_response')
  await r.knex.schema.dropTable('invite')
  await r.knex.schema.dropTable('job_request')
  await r.knex.schema.dropTable('message')
  await r.knex.schema.dropTable('migrations')
  await r.knex.schema.dropTable('opt_out')
  await r.knex.schema.dropTable('organization')
  await r.knex.schema.dropTable('pending_message_part')
  await r.knex.schema.dropTable('question_response')
  await r.knex.schema.dropTable('user_cell')
  await r.knex.schema.dropTable('user')
  await r.knex.schema.dropTable('campaign_contact')
  await r.knex.schema.dropTable('interaction_step')
  await r.knex.schema.dropTable('assignment')
  await r.knex.schema.dropTable('campaign')
}

async function setupTest() {
}

async function cleanupTest() {
  await clearTestData()
}

export function getContext(context) {
  return {
    ...context,
    req: {},
    loaders: createLoaders(),
  }
}

export { setupTest, cleanupTest, getContext }
