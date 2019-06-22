// Add creator_id column to campaign
exports.up = function(knex, Promise) {
  return knex.schema.alterTable("campaign", table => {
    table
      .integer("creator_id")
      .unsigned()
      .nullable()
      .default(null)
      .index()
      .references("id")
      .inTable("user");
  });
};

// Drop creator_id column from campaign
exports.down = function(knex, Promise) {
  return knex.schema.alterTable("campaign", table => {
    table.dropForeign("creator_id");
    table.dropColumn("creator_id");
  });
};
