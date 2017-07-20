import thinky from 'thinky'

import dumbThinky from 'rethink-knex-adapter'

/*export default thinky({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  db: process.env.DB_NAME,
  authKey: process.env.DB_KEY
})*/
export default dumbThinky({
  client: 'sqlite3',
  connection: {
    filename: "./mydb.sqlite"
  },
  defaultsUnsupported: true
})
