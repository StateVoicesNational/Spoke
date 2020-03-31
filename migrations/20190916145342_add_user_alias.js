exports.up = knex => {
  return knex.schema.table("user", table => {
    table.string("alias").defaultTo(null);
  });
};

exports.down = knex => {
  return knex.schema.table("user", table => {
    table.dropColumn("alias");
  });
};
