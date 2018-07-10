const config = require('../../../knexfile.js')
const knex = require('knex')(config)
import { tables } from './schemas/export.js'
const TEST_TIMEOUT = 30000

function compareSchemas(a, b) {
  return JSON.stringify(a, null, 2) === JSON.stringify(b, null, 2)
}

describe('The knexfile', () => {
  knex.migrate.latest()

  tables.forEach(async t => {
    it(`provides an up-to-date ${t} table schema`, () => {
      return knex(t).columnInfo()
      .then(res => {
        // eslint-disable-nextline global-require
        const originalSchema = require(`./schemas/${t}.json`)
        expect(compareSchemas(res, originalSchema)).toEqual(true)
      })
    }, TEST_TIMEOUT)
  })

  knex.raw('DROP OWNED BY spoke_test;') // make this more db-agnostic
})
