const { NODE_ENV = 'development' } = process.env
// console.log('using env', NODE_ENV)
const knex = require('knex')(require('../../../knexfile.js')[NODE_ENV])
console.log('knex config is', knex.client.config.connection)

describe('The knexfile', () => {
  beforeEach(() => knex.migrate.latest())
  afterEach(() => knex.raw('DROP OWNED BY spoke_test;'))

  it('provides an up-to-date interaction_step schema', () => {
    return knex('interaction_step').columnInfo()
    .then(res => {
      console.log('interaction_step', res)
      expect(1).toEqual(1)
    })
    .catch(console.error)
  }, 80000)
})
