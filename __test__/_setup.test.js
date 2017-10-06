import { sleep } from '../src/workers/lib';
import { r } from '../src/server/models/';

beforeAll(async () => {
  let testDbExists = false
  while (!testDbExists) {
    testDbExists = await r.knex.schema.hasTable('job_request')
    if (!testDbExists) {
      const waitUntilDbCreated = await sleep(1000)
    }
  }
});

it('should create the db before running other tests', async () => {
  expect(true).toBe(true)
})
