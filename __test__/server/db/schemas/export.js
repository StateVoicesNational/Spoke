require('dotenv').config({ path: '../../../../.env' })
const config = require('../../../../knexfile.js')
const knex = require('knex')(config)
import { tables } from './tables'
import fs from 'fs'

function getSchema(s) {
  return knex(s).columnInfo().then(schema => {
    console.log('exported schema for', s)
    fs.writeFileSync(`${s}.json`, JSON.stringify(schema, null, 2))
  })
}
function getIndexes() {
  // // return knex('pg_indexes')
  // .select()
  // .where({ schemaname: 'public' })
  // .whereNot({ tablename: 'migrations' })
  return knex.raw(`SELECT conrelid::regclass AS table_from
     , conname
     , pg_get_constraintdef(c.oid)
FROM   pg_constraint c
JOIN   pg_namespace n ON n.oid = c.connamespace
WHERE  contype IN ('f', 'p ')
AND    conrelid::regclass::text <> 'migrations'
AND    n.nspname = 'public'
ORDER  BY conrelid::regclass::text, contype DESC;`)
  // this table is deprecated now
  .then(indexes => {
    fs.writeFileSync('indexes.json', JSON.stringify(indexes, null, 2))
    console.log('exported indices')
  })
}

const tablePromises = tables.map(getSchema)
const indexesPromises = getIndexes()

Promise.all(tablePromises.concat([indexesPromises]))
  .then(() => {
    console.log('completed')
    process.exit(0)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

// Run this file _from this directory_ (e.g. with npx babel-node export.js) to get nice JSON representations of each table's schema, for testing.
