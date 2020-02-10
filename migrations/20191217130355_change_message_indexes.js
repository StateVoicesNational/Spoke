exports.up = function(knex, Promise) {
  return knex.schema.alterTable("message", table => {
    const isSqlite = /sqlite/.test(knex.client.config.client);
    // NOTE: this could be an expensive migration which locks tables for some time, if you have millions of message rows
    // In that case, we recommend performing this migration manually during planned downtime
    if (!isSqlite) {
      // sqlite is not good at dropping indexes
      table.dropIndex("contact_number"); // Will be recreated with messageservice_sid
      table.dropIndex("assignment_id"); // SHOULD NO LONGER BE REQUIRED
    }
    // For Postgres, consider concurrent creation with manual command:
    // CREATE INDEX CONCURRENTLY cell_messageservice_sid_idx ON message (contact_number, messageservice_sid)
    table.index(
      ["contact_number", "messageservice_sid"],
      "cell_messageservice_sid_idx"
    );
    // For Postgres, consider concurrent creation with manual command:
    // CREATE INDEX CONCURRENTLY message_campaign_contact_id_index ON message (campaign_contact_id)
    table.index("campaign_contact_id");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable("message", table => {
    table.dropIndex(
      ["contact_number", "messageservice_sid"],
      "cell_messageservice_sid_idx"
    );
    table.dropIndex("campaign_contact_id");
    table.index("contact_number");
    table.index("assignment_id");
  });
};
