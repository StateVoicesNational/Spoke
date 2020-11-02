exports.up = function(knex) {
  return knex.schema.alterTable("campaign", table => {
    table
      .float("budget")
      .nullable()
      .default(null);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("campaign", table => {
    table.dropColumn("budget");
  });
};
