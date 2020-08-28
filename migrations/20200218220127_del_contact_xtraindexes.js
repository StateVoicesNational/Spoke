exports.up = function up(knex) {
  const isSqlite = /sqlite/.test(knex.client.config.client);
  return knex.schema.alterTable("campaign_contact", table => {
    if (!isSqlite) {
      table.dropIndex("assignment_id");
      table.dropIndex("campaign_id");
    }
  });
};

exports.down = function down(knex) {
  const isSqlite = /sqlite/.test(knex.client.config.client);
  return knex.schema.alterTable("campaign_contact", table => {
    if (!isSqlite) {
      table.index("assignment_id");
      table.index("campaign_id");
    }
  });
};
