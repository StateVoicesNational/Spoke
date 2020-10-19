exports.up = function(knex) {
  return knex.schema.alterTable("campaign", table => {
    table
      .float("outgoing_message_cost")
      .nullable()
      .default(null);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable("campaign", table => {
    table.dropColumn("outgoing_message_cost");
  });
};
