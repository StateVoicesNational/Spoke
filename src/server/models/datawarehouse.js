import knex from 'knex'

let config
let warehouseConn

if (process.env.WAREHOUSE_DB_TYPE) {
  config = {
    client: process.env.WAREHOUSE_DB_TYPE,
    connection: {
      host: process.env.WAREHOUSE_DB_HOST,
      port: process.env.WAREHOUSE_DB_PORT,
      database: process.env.WAREHOUSE_DB_NAME,
      password: process.env.WAREHOUSE_DB_PASSWORD,
      user: process.env.WAREHOUSE_DB_USER
    }
  }
}

export default (config ? knex(config) : null)
