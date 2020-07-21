exports.up = function(knex) {
  return knex.schema.table("campaign", table => {
    table.boolean("request_after_reply").defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.table("campaign", table => {
    table.dropColumn("request_after_reply");
  });
};
