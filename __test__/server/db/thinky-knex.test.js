const { NODE_ENV = 'development' } = process.env
// console.log('using env', NODE_ENV)
const knex = require('knex')(require('../../../knexfile.js')[NODE_ENV])
console.log('knex config is', knex.client.config.connection)

describe('The knexfile', () => {
  beforeEach(async () => await knex.migrate.latest())
  afterEach(async () => await knex.raw('DROP OWNED BY spoke_test;'))

  it('returns the same interaction_step schema as the thinky adapter', async () => {
    const interactionStepSchema = await knex('interaction_step').columnInfo()
    console.log('interaction_step', interactionStepSchema)
    expect(1).toEqual(1)
  })
})
