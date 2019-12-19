exports.config = {
  // in order for the raw CONCURRENTLY commands, we need to disable transasctions for this migration
  transaction: false
};

exports.up = function(knex, Promise) {
  const isPostgres = knex.client.config.client === "pg";
  return knex.schema
    .alterTable("message", table => {
      // NOTE: this could be an expensive migration which locks tables for some time, if you have millions of message rows
      // In that case, we recommend performing this migration manually during planned downtime

      // 1.5: backfill messageservice_sid for running campaigns
      table.dropIndex("contact_number"); // Will be recreated with messageservice_sid
    })
    .then(() => {
      if (isPostgres) {
        return knex.schema.raw(
          `CREATE INDEX CONCURRENTLY cell_messageservice_sid_idx ON message (contact_number, messageservice_sid)`
        );
      } else {
        return knex.schema.alterTable("message", table => {
          table.index(
            ["contact_number", "messageservice_sid"],
            "cell_messageservice_sid_idx"
          );
        });
      }

      // 2. create index concurrently (if postgres)
      //table.index("campaign_contact_id");
      // 3. drop Index on assignment_id
    })
    .then(() => {
      if (isPostgres) {
        return knex.schema.raw(
          `CREATE INDEX CONCURRENTLY message_campaign_contact_id_index ON message (campaign_contact_id)`
        );
      } else {
        return knex.schema.alterTable("message", table => {
          table.index(
            "campaign_contact_id",
            "message_campaign_contact_id_index"
          );
        });
      }
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable("message", table => {
    table.dropIndex(
      ["contact_number", "messageservice_sid"],
      "cell_messageservice_sid_idx"
    );
    table.dropIndex("campaign_contact_id", "message_campaign_contact_id_index");
    table.index("contact_number");
  });
};
