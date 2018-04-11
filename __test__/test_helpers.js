import {createLoaders, r} from '../src/server/models/'
import { sleep } from '../src/workers/lib'


export async function setupTest() {
  createLoaders()
  let i
  for (i = 0; i < 10; i++) {
    const results = [
      await r.knex.schema.hasTable('user'),
      await r.knex.schema.hasTable('pending_message_part'),
      await r.knex.schema.hasTable('organization'),
      await r.knex.schema.hasTable('campaign'),
      await r.knex.schema.hasTable('assignment'),
      await r.knex.schema.hasTable('campaign_contact'),
      await r.knex.schema.hasTable('interaction_step'),
      await r.knex.schema.hasTable('question_response'),
      await r.knex.schema.hasTable('opt_out'),
      await r.knex.schema.hasTable('migrations'),
      await r.knex.schema.hasTable('job_request'),
      await r.knex.schema.hasTable('invite'),
      await r.knex.schema.hasTable('canned_response'),
      await r.knex.schema.hasTable('user_organization'),
      await r.knex.schema.hasTable('user_cell'),
      await r.knex.schema.hasTable('message'),
      await r.knex.schema.hasTable('zip_code'),
      await r.knex.schema.hasTable('log')
    ]

    if (results.some((element) => !element)) {
      await sleep(i * 1000)
    }
    else {
      return
    }
  }
}

export async function cleanupTest() {
  // Drop tables in an order that drops foreign keys before dependencies
  await r.knex.schema.dropTableIfExists('log')
  await r.knex.schema.dropTableIfExists('zip_code')
  await r.knex.schema.dropTableIfExists('user_cell')
  await r.knex.schema.dropTableIfExists('user_organization')
  await r.knex.schema.dropTableIfExists('canned_response')
  await r.knex.schema.dropTableIfExists('invite')
  await r.knex.schema.dropTableIfExists('job_request')
  await r.knex.schema.dropTableIfExists('migrations')
  await r.knex.schema.dropTableIfExists('opt_out')
  await r.knex.schema.dropTableIfExists('message')
  await r.knex.schema.dropTableIfExists('question_response')
  await r.knex.schema.dropTableIfExists('interaction_step')
  await r.knex.schema.dropTableIfExists('campaign_contact')
  await r.knex.schema.dropTableIfExists('assignment')
  await r.knex.schema.dropTableIfExists('campaign')
  await r.knex.schema.dropTableIfExists('organization')
  await r.knex.schema.dropTableIfExists('pending_message_part')
  await r.knex.schema.dropTableIfExists('user')
}



