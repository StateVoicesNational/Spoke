exports.up = function(knex) {
  return knex.schema.alterTable("campaign", table => {
    table
      .float("incoming_message_cost")
      .nullable()
      .default(null);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("campaign", table => {
    table.dropColumn("incoming_message_cost");
  });
};
