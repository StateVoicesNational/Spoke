import {createLoaders, r} from '../src/server/models/'
import {sleep} from '../src/workers/lib'

async function checkTables() {
  return Promise.all([
    r.knex.schema.hasTable('assignment'),
    r.knex.schema.hasTable('campaign'),
    r.knex.schema.hasTable('campaign_contact'),
    r.knex.schema.hasTable('canned_response'),
    r.knex.schema.hasTable('interaction_step'),
    r.knex.schema.hasTable('invite'),
    r.knex.schema.hasTable('job_request'),
    r.knex.schema.hasTable('log'),
    r.knex.schema.hasTable('message'),
    r.knex.schema.hasTable('migrations'),
    r.knex.schema.hasTable('opt_out'),
    r.knex.schema.hasTable('organization'),
    r.knex.schema.hasTable('pending_message_part'),
    r.knex.schema.hasTable('question_response'),
    r.knex.schema.hasTable('user'),
    r.knex.schema.hasTable('user_cell'),
    r.knex.schema.hasTable('user_organization'),
    r.knex.schema.hasTable('zip_code')])
}

export async function setupTest() {
  createLoaders()
  let i = 0
  while (i++ < 10) {
    const results = await checkTables()
    if (results.some((element) => !element)) {
      await sleep(i * 1000)
    } else {
      break
    }
  }
}

export async function cleanupTest() {
  // Drop tables in an order that drops foreign keys before dependencies
  let i = 0
  while (i++ < 10) {
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

    const results = await checkTables()
    if (results.some((element) => element)) {
      await sleep(i * 1000)
    } else {
      break
    }
  }
}

export function getContext(context) {
  return {
    ...context,
    req: {},
    loaders: createLoaders(),
  }
}
