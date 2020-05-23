// Define a Knex connection. Currently, this is used only to instantiate the
// rethink-knex-adapter's connection. In the future, if the adapter is
// deprecated, a better pattern would be to instantiate knex here and export
// that instance, for reference everywhere else in the codebase.
const {
  DB_USE_SSL = "false",
  DB_JSON = global.DB_JSON,
  DB_HOST = "127.0.0.1",
  DB_PORT = "5432",
  DB_MIN_POOL = 2,
  DB_MAX_POOL = 10,
  DB_TYPE,
  DB_NAME,
  DB_PASSWORD,
  DB_USER,
  DB_SCHEMA,
  DATABASE_URL,
  NODE_ENV
} = process.env;
const min = parseInt(DB_MIN_POOL, 10);
const max = parseInt(DB_MAX_POOL, 10);

const pg = require("pg");

const useSSL = DB_USE_SSL === "1" || DB_USE_SSL.toLowerCase() === "true";
if (useSSL) pg.defaults.ssl = true;
// see https://github.com/tgriesser/knex/issues/852

let config;

if (DB_JSON) {
  config = JSON.parse(DB_JSON);
} else if (DB_TYPE) {
  config = {
    client: DB_TYPE,
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      password: DB_PASSWORD,
      user: DB_USER,
      ssl: useSSL
    },
    migrations: {
      directory: process.env.KNEX_MIGRATION_DIR || "./migrations/"
    },
    pool: { min, max }
  };
} else if (DATABASE_URL) {
  const dbType = DATABASE_URL.match(/^\w+/)[0];
  config = {
    client: /postgres/.test(dbType) ? "pg" : dbType,
    connection: DATABASE_URL,
    searchPath: DB_SCHEMA || "",
    migrations: {
      directory: process.env.KNEX_MIGRATION_DIR || "./migrations/"
    },
    pool: { min, max },
    ssl: useSSL
  };
} else if (NODE_ENV === "test") {
  config = {
    client: "pg",
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      database: "spoke_test",
      password: "spoke_test",
      user: "spoke_test",
      ssl: useSSL
    }
  };
} else {
  config = {
    client: "sqlite3",
    connection: { filename: "./mydb.sqlite" },
    defaultsUnsupported: true,
    useNullAsDefault: true
  };
}

module.exports = config;
