exports.up = knex => {
  return knex.schema.table("message", table => {
    table.jsonb("media").defaultTo(null);
  });
};

exports.down = knex => {
  return knex.schema.table("message", table => {
    table.dropColumn("media");
  });
};
