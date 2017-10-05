import { createLoaders, r } from '../src/server/models/'

async function clearTestData() {
  r.knex.schema.dropTable('assignment')
  r.knex.schema.dropTable('campaign')
  r.knex.schema.dropTable('campaign_contact')
  r.knex.schema.dropTable('canned_response')
  r.knex.schema.dropTable('interaction_step')
  r.knex.schema.dropTable('invite')
  r.knex.schema.dropTable('job_request')
  r.knex.schema.dropTable('message')
  r.knex.schema.dropTable('migrations')
  r.knex.schema.dropTable('opt_out')
  r.knex.schema.dropTable('organization')
  r.knex.schema.dropTable('pending_message_part')
  r.knex.schema.dropTable('question_response')
  r.knex.schema.dropTable('user')
  r.knex.schema.dropTable('user_organization')
  r.knex.schema.dropTable('zip_code')
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
