import {r} from '../../../src/server/models'
import { indexQuery, tables } from './utils.js'
jest.setTimeout(20000)


describe('The knex initial migration', async () => {
  beforeAll(async () => {
    await r.k.migrate.latest()
  })
  afterAll(async () => {
    // tests only run in PG so this should work
    await r.k.raw('DROP OWNED BY spoke_test;')
    await r.k.destroy()
  })
  // Test the schema for each table
  for (let i = 0; i < tables.length; i++) {
    const t = tables[i]
    it(`generates the correct ${t} table schema`, async () => {
      // eslint-disable-next-line global-require
      const originalSchema = require(`./init_schemas/${t}.json`)
      const newSchema = await r.k(t).columnInfo()
      expect(newSchema).toMatchSchema(originalSchema)
    })
  }

  it('creates the correct indices', async () => {
    // eslint-disable-next-line global-require
    const originalIndexes = require('./init_schemas/indexes.json')
    const newIndexes = await r.k.raw(indexQuery)
    expect(newIndexes.rows).toMatchIndexes(originalIndexes.rows)
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
      const originalIndex = originalIndexes.shift()
      const { conname, table_from } = originalIndex
      const scopedconname = `${table_from}.${conname}`
      const foundI = newIndexes.findIndex(el => el.conname === conname)
      if (foundI === -1) { // terminology to clarify the difference between a table index we're examinging and an index representing position in an array
        errors.push(`Expected index ${printExpected(scopedconname)} but it was not found`)
      } else {
        // Since the index was located, remove it from the array
        const [newIndex] = newIndexes.splice(foundI, 1)

        // Test for equality of the pg constraint def
        const originalIndexConstraintdef = originalIndex.pg_get_constraintdef
        const newIndexConstraintdef = newIndex.pg_get_constraintdef
        if(originalIndexConstraintdef !== newIndexConstraintdef) {
          errors.push(`Expected ${printExpected(scopedconname)} to have constraintdef ${printExpected(originalConstraintdef)}, but received ${printReceived(newIndexConstraintdef)}.`)
        }
      }
    }
    // at this point, the originalIndexes array will be empty. Check for any remaining items in newIndexes, and output appropriate errors if they exist (since they're extraneous).
    if (newIndexes.length > 0) {
      for (let i = 0; i < newIndexes.length; i++) {
        const { conname, table_from } = newIndexes[i]
        const scopedconname = `${table_from}.${conname}`
        errors.push(`Received unexpected index ${printReceived(scopedconname)}`)
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
