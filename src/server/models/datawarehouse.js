import knex from "knex";

const {
  WAREHOUSE_DB_TYPE,
  WAREHOUSE_DB_HOST,
  WAREHOUSE_DB_PORT,
  WAREHOUSE_DB_NAME,
  WAREHOUSE_DB_PASSWORD,
  WAREHOUSE_DB_USER,
  WAREHOUSE_DB_SCHEMA = "",
  WAREHOUSE_USE_SSL = "false",
} = process.env;

const useSSL = WAREHOUSE_USE_SSL === "1"
  || WAREHOUSE_USE_SSL.toLowerCase() === "true";

let config;

if (WAREHOUSE_DB_TYPE) {
  config = {
    client: WAREHOUSE_DB_TYPE,
    connection: {
      host: WAREHOUSE_DB_HOST,
      port: WAREHOUSE_DB_PORT,
      database: WAREHOUSE_DB_NAME,
      password: WAREHOUSE_DB_PASSWORD,
      user: WAREHOUSE_DB_USER,
      searchPath: WAREHOUSE_DB_SCHEMA,
      ssl: useSSL
    }
  };
}

export default WAREHOUSE_DB_TYPE ? () => knex(config) : null;
