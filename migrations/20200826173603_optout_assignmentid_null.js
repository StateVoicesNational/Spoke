exports.up = async knex => {
  const isSqlite = /sqlite/.test(knex.client.config.client);
  if (!isSqlite) {
    await knex.schema.alterTable("opt_out", table => {
      table
        .integer("assignment_id")
        .alter()
        .nullable();
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
