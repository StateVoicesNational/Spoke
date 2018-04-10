import dumbThinky from 'rethink-knex-adapter'
import redisStore from 'connect-redis'
import fakeredis from 'fakeredis'

// // This was how to connect to rethinkdb:
// export default thinky({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   db: process.env.DB_NAME,
//   authKey: process.env.DB_KEY
// })

let config

if (process.env.DB_JSON || global.DB_JSON) {
  config = JSON.parse(process.env.DB_JSON || global.DB_JSON)
} else if (process.env.DB_TYPE) {
  const use_ssl = process.env.DB_USE_SSL && (process.env.DB_USE_SSL.toLowerCase() === 'true' || process.env.DB_USE_SSL === '1')
  config = {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      user: process.env.DB_USER,
      ssl: use_ssl
    },
    pool: {
      min: process.env.DB_MIN_POOL || 2,
      max: process.env.DB_MAX_POOL || 10
    }
  }
} else if (process.env.DATABASE_URL) {
  const databaseType = process.env.DATABASE_URL.match(/^\w+/)[0]
  config = {
    client: (/postgres/.test(databaseType) ? 'pg' : databaseType),
    connection: process.env.DATABASE_URL,
    pool: {
      min: process.env.DB_MIN_POOL || 2,
      max: process.env.DB_MAX_POOL || 10
    }
  }
} else {
  config = {
    client: 'sqlite3',
    connection: {
      filename: './mydb.sqlite'
    },
    defaultsUnsupported: true
  }
}

const thinkyConn = dumbThinky(config)

thinkyConn.r.getCount = async (query) => {
  // helper method to get a count result
  // with fewer bugs.  Using knex's .count()
  // results in a 'count' key on postgres, but a 'count(*)' key
  // on sqlite -- ridiculous.  This smooths that out
  return Number((await query.count('* as count').first()).count)
}

if(process.env.REDIS_URL){
  thinkyConn.r.redis = redisStore({url: process.env.REDIS_URL})
} else if (process.env.REDIS_FAKE){
  thinkyConn.r.redis = fakeredis.createClient()
}

export default thinkyConn
