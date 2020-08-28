exports.up = knex => {
  return knex.schema.table("user", table => {
    table.jsonb("extra").defaultTo(null);
  });
};

exports.down = knex => {
  return knex.schema.table("user", table => {
    table.dropColumn("extra");
  });
};
