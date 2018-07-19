require('dotenv').config({ path: '../../../../.env' })
const config = require('../../../../knexfile.js')
const knex = require('knex')(config)
import { tables } from './tables'
import fs from 'fs'

function getSchema(s) {
  knex(s).columnInfo().then(schema => {
    console.log('exported schema for', s)
    fs.writeFile(`${s}.json`, JSON.stringify(schema, null, 2))
  })
}
function getIndexes() {
  knex('pg_indexes')
  .select()
  .where({ schemaname: 'public' })
  .then(indexes => {
    fs.writeFile('indexes.json', JSON.stringify(indexes, null, 2))
    console.log('exported indices')
  })
}

tables.forEach(getSchema)
getIndexes()

// Run this file _from this directory_ (e.g. with npx babel-node export.js) to get nice JSON representations of each table's schema, for testing.
