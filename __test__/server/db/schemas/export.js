require('dotenv').config({ path: '../../../../.env' })
const config = require('../../../../knexfile.js')
const knex = require('knex')(config)
import { tables } from './tables'
import fs from 'fs'

function getSchema(s) {
  return knex(s).columnInfo().then(schema => {
    fs.writeFile(`${s}.json`, JSON.stringify(schema, null, 2))
  })
}
function getIndexes() {
  return knex('pg_indexes')
  .select()
  .where({ schemaname: 'public' })
  .whereNot({ tablename: 'migrations' })
  // this table is deprecated now
  .then(indexes => {
    fs.writeFile('indexes.json', JSON.stringify(indexes, null, 2))
    console.log('exported indices')
  })
}

const tablePomises = tables.map(getSchema)
const indexesPromises = getIndexes()

Promise.all(tablePomises.concat([indexesPromises]))
  .then(() => {
    console.log('completed')
    process.exit(0)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

// Run this file _from this directory_ (e.g. with npx babel-node export.js) to get nice JSON representations of each table's schema, for testing.
