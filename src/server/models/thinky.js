import thinky from 'thinky'

import dumbThinky from 'rethink-knex-adapter'

//// This was how to connect to rethinkdb:
// export default thinky({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   db: process.env.DB_NAME,
//   authKey: process.env.DB_KEY
// })

let config

if (process.env.DB_JSON) {
  config = JSON.parse(process.env.DB_JSON)
} else if (process.env.DB_TYPE) {
  config = {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      user: process.env.DB_USER,
      ssl: process.env.DB_USE_SSL || false
    }
  }
} else {
  config = {
    client: 'sqlite3',
    connection: {
      filename: "./mydb.sqlite"
    },
    defaultsUnsupported: true
  }
}

const thinkyConn = dumbThinky(config)

export default thinkyConn
