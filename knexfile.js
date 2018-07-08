const { DB_USE_SSL, DB_TYPE, DB_JSON = global.DB_JSON, DB_HOST, DB_PORT, DB_NAME, DB_PASSWORD, DB_USER, DB_MIN_POOL = 2, DB_MAX_POOL = 10, DATABASE_URL } = process.env

const useSSL = DB_USE_SSL && (DB_USE_SSL.toLowerCase() === 'true' || DB_USE_SSL === '1')

// TODO if useSSL then pg.defaults.ssl = true (figure out whether pg should be imported here)

let config

if (DB_JSON) {
  config = JSON.parse(DB_JSON)
} else if (DB_TYPE) {
  config = {
    client: 'pg',
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      password: DB_PASSWORD,
      user: DB_USER,
      ssl: useSSL
    },
    pool: {
      min: DB_MIN_POOL,
      max: DB_MAX_POOL
    }
  }
} else if (DATABASE_URL) {
  const dbType = DATABASE_URL.match(/^\w+/)[0]
  config = {
    client: (/postgres/.test(dbType) ? 'pg' : dbType),
    connection: DATABASE_URL,
    pool: {
      min: DB_MIN_POOL,
      max: DB_MAX_POOL
    },
    ssl: useSSL
  }
} else {
  config = {
    client: 'sqlite3',
    connection: { filename: './mydb.sqlite' },
    defaultsUnsupported: true
  }
}

export default {
  development: config,
  staging: config,
  production: config,
  test: {

  }
}
