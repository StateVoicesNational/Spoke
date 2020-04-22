exports.up = function(knex) {
  return knex.schema.table("campaign", table => {
    table.string("messaging_service_sid").defaultTo(null);
    table.boolean("use_own_messaging_service").defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.table("campaign", table => {
    table.dropColumn("messaging_service_sid");
    table.dropColumn("use_own_messaging_service");
  });
};
