exports.up = function(knex) {
  return knex.schema.table("campaign", table => {
    table.text("join_token").defaultTo(null);
    table.integer("batch_size").defaultTo(null);
    table.json("features").defaultTo(null);
  });
};

exports.down = function(knex) {
  return knex.schema.table("campaign", table => {
    table.dropColumn("join_token");
    table.dropColumn("batch_size");
    table.dropColumn("features");
  });
};
