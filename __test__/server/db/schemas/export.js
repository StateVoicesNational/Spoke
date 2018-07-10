require('dotenv').config({ path: '../../../../.env' })
const config = require('../../../../knexfile.js')
const knex = require('knex')(config)
import fs from 'fs'

function getSchema(s) {
  knex(s).columnInfo().then(schema => {
    console.log('exported schema for', s)
    fs.writeFile(`${s}.json`, JSON.stringify(schema, null, 2))
  })
}

export const tables = ['log', 'message', 'user_cell', 'job_request', 'migrations', 'pending_message_part', 'zip_code', 'invite', 'user', 'user_organization', 'campaign', 'interaction_step', 'assignment', 'organization', 'canned_response', 'opt_out', 'question_response', 'campaign_contact']

tables.forEach(getSchema)

// Run this file (probably with npx babel-node export.js) to get nice JSON representations of each table's schema, for testing.
