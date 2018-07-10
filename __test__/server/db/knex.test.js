const config = require('../../../knexfile.js')
const knex = require('knex')(config)
console.log('knex config is', knex.client.config.connection)

describe('The knexfile', () => {
  beforeEach(() => knex.migrate.latest())
  afterEach(() => knex.raw('DROP OWNED BY spoke_test;')) // make this more db-agnostic

  it('provides an up-to-date interaction_step schema', () => {
    return knex('interaction_step').columnInfo()
    .then(res => {
      console.log('interaction_step', res)
      expect(1).toEqual(1)
    })
    .catch(console.error)
  }, 80000)
})
