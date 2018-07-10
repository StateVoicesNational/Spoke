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

tables.forEach(getSchema)

// Run this file _from this directory_ (e.g. with npx babel-node export.js) to get nice JSON representations of each table's schema, for testing.
