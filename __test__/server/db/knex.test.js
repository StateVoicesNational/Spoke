const config = require('../../../knexfile.js')
const knex = require('knex')(config)
// import { tables } from './schemas/tables.js'
// still need to define this manually as we add them to the migration so they test output isn't rendered useless by being flooded with messages about tables whose schemas don't exist yet
const tables = ['user', 'pending_message_part']
const TEST_TIMEOUT = 20000

// knex.on('query', console.log)

describe('The knex initial migration', async () => {
  beforeAll(async () => {
    await knex.migrate.latest()
  })
  afterAll(async () => {
    // tests only run in PG so this should work
    await knex.raw('DROP OWNED BY spoke_test;')
    await knex.destroy()
  })

  tables.forEach(async t => {
    it(`generates the correct ${t} table schema`, () => {
      expect.assertions(1)
      // eslint-disable-next-line global-require
      const originalSchema = require(`./schemas/${t}.json`)
      return knex(t).columnInfo()
      .then(newSchema => {
        // console.log('new schema is', newSchema)
        // console.log('original schema is', originalSchema)
        expect(newSchema).toMatchSchema(originalSchema)
      })
    }, TEST_TIMEOUT)
  })
})

Object.entries = o => Object.keys(o).map(k => [k, o[k]])
// jest doesn't provide babel-polyfill, so we roll our own

expect.extend({
  toMatchSchema(newSchema, originalSchema) {
    const { printExpected, printReceived } = this.utils // utility functions
    const originalSchemaColumns = Object.entries(originalSchema)
    const newSchemaColumns = Object.entries(newSchema)
    // check for the same number of columns
    if (originalSchemaColumns.length !== newSchemaColumns.length) {
      return {
        pass: false,
        message: () => `Expected new schema to have ${printExpected(originalSchemaColumns.length)} columns, but it has ${printReceived(newSchemaColumns.length)}.`
      }
    }
    // Check each column for deep equality. Since we now know the new and old schemas have the same number of columns, and since duplicate column names cannot exist, this check is definitive.
    const errors = []
    // If the new and old schemas have the same number of columns, and the columns match, the errors array will group any errors _on the individual column attributes_ together and return them all at once.
    for (const [newColumnName, newColumnProperties] of newSchemaColumns) {
      const originalColumnProperties = originalSchema[newColumnName]
      // Ensure this column exists in the old schema
      if (!originalColumnProperties) {
        return {
          pass: false,
          message: () => `Expected new schema not to have column ${printReceived(newColumnName)}.`
        }
      }
      // What's being referred to here as column 'entries' are properties on the object representing that column's attributes. For example, if it's part of a sequence, what type of data it stores, etc.
      const newColumnEntries = Object.entries(newColumnProperties)
      const originalColumnEntries = Object.entries(originalColumnProperties)
      // Ensure the same number of attributes for each column.
      if (originalColumnEntries.length !== newColumnEntries.length) {
        return {
          pass: false,
          message: () => `Expected column ${printExpected(newColumnName)} to have ${printExpected(originalColumnEntries.length)} properties, but it has ${printReceived(newColumnEntries.length)}.`
        }
      }
      // This is the meat of the test: ensure that all the properties on each column are the same. Similar to the outer loop, since we've already determined that the new and old schemas' definitions of this column have the same number of properties, this check is definitive, and any mismatches represent errors.
      for (const [propertyName, propertyValue] of newColumnEntries) {
        if (originalColumnProperties[propertyName] !== propertyValue) {
          errors.push(`Expected property ${printExpected(propertyName)} on column ${printExpected(newColumnName)} to have value ${printExpected(originalColumnProperties[propertyName])}, but received ${printReceived(propertyValue)}.\n`)
        }
      }
    }
    if (errors.length > 0) {
      return {
        pass: false,
        message: () => errors.join(`\n`)
      }
    }
    return { pass: true }
  }
})
