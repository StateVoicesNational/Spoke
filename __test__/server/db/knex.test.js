const config = require('../../../knexfile.js')
const knex = require('knex')(config)
import { tables } from './schemas/tables.js'
jest.setTimeout(20000)

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
  // Test the schema for each table
  for (let i = 0; i < tables.length; i++) {
    const t = tables[i]
    it(`generates the correct ${t} table schema`, async () => {
      // eslint-disable-next-line global-require
      const originalSchema = require(`./schemas/${t}.json`)
      const newSchema = await knex(t).columnInfo()
      expect(newSchema).toMatchSchema(originalSchema)
    })
  }

  it('creates the correct indices', async () => {
    // eslint-disable-next-line global-require
    const originalIndexes = require('./schemas/indexes.json')
    const newIndexes = await knex('pg_indexes').select().where({ schemaname: 'public' })
    expect(newIndexes).toMatchIndexes(originalIndexes)
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
  },
  toMatchIndexes(newIndexes, originalIndexes) {
    const { printExpected, printReceived } = this.utils // utility
    const errors = [] // same as with the other custom test function; we want to return as much useful information as possible, so we'll collect errors and return them all at the end.

    // Test for the same number of indices
    if (newIndexes.length !== originalIndexes.length) {
      errors.push(`Expected ${printExpected(originalIndexes.length)} indexes, but received ${printReceived(newIndexes.length)}`)
    }

    // Loop through the expected indexes
    while (originalIndexes.length > 0) {
      // Index names are unique, so we can search by name in the received index array
      const { indexname, tablename } = originalIndexes[0]
      const scopedIndexName = `${tablename}.${indexname}`
      const foundI = newIndexes.findIndex(el => el.indexname === indexname)
      if (foundI === -1) { // terminology to clarify the difference between a table index we're examinging and an index representing position in an array
        errors.push(`Expected index ${printExpected(scopedIndexName)} but it was not found`)
      } else {
        const newIndex = newIndexes[foundI]
        // test for deep equality of all index properties here, and splice the found index out of the newIndexes array when done.
        const originalIndexEntries = Object.entries(originalIndexes[0])
        const newIndexPropsLength = Object.keys(newIndex).length
        if (originalIndexEntries.length !== newIndexPropsLength) {
          errors.push(`Expected ${printExpected(scopedIndexName)} to have ${printExpected(originalIndexEntries.length)} properties, but received ${printReceived(newIndexPropsLength)}`)
        }
        // Check each property of the expected indexes for equality against the new ones
        for (let i = 0; i < originalIndexEntries.length; i++) {
          const [k, v] = originalIndexEntries[i]
          if (newIndex[k] !== v) {
            const scopedPropName = `${scopedIndexName}.${k}`
            errors.push(`Expected ${printExpected(scopedPropName)} to be ${printExpected(v)}, but received ${printReceived(newIndex[k])}.`)
          }
        }
      }
      originalIndexes.splice(0, 1)
    }
    // at this point, the originalIndexes array will be empty. Check for any remaining items in newIndexes, and output appropriate errors if they exist (since they're extraneous).

    if (errors.length > 0) {
      return {
        pass: false,
        message: () => errors.join(`\n`)
      }
    }
    return { pass: true }
  }
})
