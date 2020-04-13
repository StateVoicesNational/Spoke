exports.up = function(knex) {
  return knex.schema.table("campaign", table => {
    table.string("messaging_service_sid").defaultTo(null);
  });
};

exports.down = function(knex) {
  return knex.schema.table("campaign", table => {
    table.dropColumn("messaging_service_sid");
  });
};
