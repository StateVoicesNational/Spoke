exports.up = function(knex) {
  return knex.schema.alterTable("campaign", table => {
    table.boolean("use_budget").default(false);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("campaign", table => {
    table.dropColumn("use_budget");
  });
};
