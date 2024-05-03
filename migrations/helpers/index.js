exports.isSqlite = knex => {
  return /sqlite/.test(knex.client.config.client);
};

// Recreate table with new schema, to work around lacking ALTER TABLE functionality
// If needed we could add functionality to migrate data to the new table
exports.redefineSqliteTable = async (knex, tableName, newTableFn) => {
  if (!exports.isSqlite(knex)) {
    throw Error("Must be connected to Sqlite");
  }
  await knex.schema.dropTable(tableName);
  await knex.schema.createTable(tableName, newTableFn);
};


exports.onUpdateTrigger = table => `
CREATE TRIGGER ${table}_updated_at
BEFORE UPDATE ON ${table}
FOR EACH ROW
EXECUTE PROCEDURE on_update_timestamp();
`