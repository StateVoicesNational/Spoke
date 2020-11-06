exports.up = async knex => {
  const isSqlite = /sqlite/.test(knex.client.config.client);
  if (!isSqlite) {
    await knex.schema.alterTable("opt_out", table => {
      table.dropForeign("assignment_id");
    });
    await knex.schema.alterTable("opt_out", table => {
      table
        .integer("assignment_id")
        .alter()
        .unsigned()
        .nullable();
      table.foreign("assignment_id").references("assignment.id");
    });
  }
};

exports.down = async knex => {
  const isSqlite = /sqlite/.test(knex.client.config.client);
  if (!isSqlite) {
    await knex.schema.alterTable("opt_out", table => {
      table
        .integer("assignment_id")
        .alter()
        .notNullable();
    });
  }
};
