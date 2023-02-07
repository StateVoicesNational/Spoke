exports.up = async function up(knex) {
  const isSqlite = /sqlite/.test(knex.client.config.client);

  if (!process.env.NO_INDEX_CHANGES) {
    // For Postgres, consider concurrent creation with manual command:
    // CREATE INDEX CONCURRENTLY cell_msgsvc_user_number_idx ON message (contact_number, messageservice_sid, user_number);
    // DROP INDEX cell_messageservice_sid_idx;
    await knex.schema.alterTable("message", t => {
      // we need user_number indexed for when/if service has no messageservice_sid and only indexes by phone numbers
      t.index(
        ["contact_number", "messageservice_sid", "user_number"],
        "cell_msgsvc_user_number_idx"
      );
      // sqlite is not good at dropping indexes and index might not be named
      // t.dropIndex("cell_messageservice_sid_idx");
    });
  }

  await knex.schema.createTable("organization_contact", t => {
    t.increments("id").primary();
    t.integer("organization_id")
      .references("id")
      .inTable("organization");
    t.text("contact_number").notNullable();
    t.text("user_number");
    t.text("service");
    t.integer("subscribe_status").defaultTo(0);
    t.integer("status_code");
    t.integer("last_error_code");
    t.text("carrier");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("last_lookup").defaultTo(null);
    t.text("lookup_name");

    t.index(
      // putting contact_number first, in-case queries can ever span organizations
      ["contact_number", "organization_id"],
      "organization_contact_organization_contact_number"
    );

    t.index(
      ["organization_id", "user_number"],
      "organization_contact_organization_user_number"
    );

    t.index(
      ["status_code", "organization_id"],
      "organization_contact_status_code_organization_id"
    );
    t.unique(["contact_number", "organization_id"]);
  });
};

exports.down = async function down(knex) {
  const isSqlite = /sqlite/.test(knex.client.config.client);
  if (!isSqlite && !process.env.NO_INDEX_CHANGES) {
    try {
      await knex.schema.alterTable("message", t => {
        t.index(
          ["contact_number", "messageservice_sid"],
          "cell_messageservice_sid_idx"
        );
        t.dropIndex("cell_msgsvc_user_number_idx");
      });
    } catch (err) {
      // pass if indexes exist and/or dropped
    }
  }

  await knex.schema.dropTableIfExists("organization_contact");
};
