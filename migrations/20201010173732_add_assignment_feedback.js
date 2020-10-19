exports.up = knex => {
  return knex.schema.table("assignment", table => {
    table.text("feedback").defaultTo(null);
  });
};

exports.down = knex => {
  return knex.schema.table("assignment", table => {
    table.dropColumn("feedback");
  });
};
