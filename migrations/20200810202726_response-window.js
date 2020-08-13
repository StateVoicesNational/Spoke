exports.up = function(knex) {
  return knex.schema.table("campaign", table => {
    table.float("response_window").defaultTo(null);
  });
};

exports.down = function(knex) {
  return knex.schema.table("campaign", table => {
    table.dropColumn("response_window");
  });
};
