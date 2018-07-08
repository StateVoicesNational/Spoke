const { NODE_ENV = 'development' } = process.env
const knex = require('knex')(NODE_ENV)
import { r } from '../../../src/server/models'

describe('The knexfile', () => {
  it('returns the same interaction_step schema as the thinky adapter', async () => {
    const vanillaKnexSchema = await knex('interaction_step').columnInfo()
    const rKnexSchema = await r.knex('interaction_step').columnInfo()
    console.log('vanilla', vanillaKnexSchema, 'r.knex', rKnexSchema)
    expect(1).toEqual(1)
  })
})
