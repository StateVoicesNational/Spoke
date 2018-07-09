const fs = require('fs')
const initQuery = fs.readFileSync('migrations/init.sql').toString()
/*
Steps taken to obtain this sql dump file:
1. run `pg_dump -Os spoke-db-name >> init.sql`
  - -O omits owner information
  - -s dumps the schema only, no data
2. Comment out these lines near the top (if these do something important, I don't know what it is, and they were breaking things):
  - CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;
  - COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';
3. Use a regex search/replace to make all the CREATE <blah> statements be CREATE <blah> IF NOT exists. Example: search /CREATE ([a-z]*) public\./ig and replace with /CREATE $1 IF NOT EXISTS public\./
*/

module.exports = {
  up: (knex, Promise) => {
    return knex.raw(initQuery)
    /*
    Still getting annoying errors in this migration. Something about the raw transaction seems to be preventing Knex from creating the knex_migrations table, so it fails there. When this was replaced with functional knex calls (i.e. createTableIfNotExists('blah')), the migration worked fine in the test environment! Another argument for scrapping the batch file and doing this all manually.
    */
    .then(res => {
      console.log('init query complete', res)
      Promise.resolve()
    })
    .catch(err => {
      console.error(err)
      Promise.reject()
    })
    // see https://stackoverflow.com/questions/30880537/can-pg-dump-be-instructed-to-create-tables-with-if-not-exists to add IF NOT EXISTS in so this migration won't throw a billion errors when run in non-test environments
  },
  down: (knex, Promise) => {
    Promise.resolve()
  }
}
