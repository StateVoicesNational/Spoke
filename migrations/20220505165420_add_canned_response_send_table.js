exports.up = async function up(knex) {
  await knex.schema.createTable("canned_response_send", t => {
    t.increments("id").primary();
    t.integer("canned_response_id")
      .references("id")
      .inTable("canned_response");
    t.integer("campaign_contact_id")
      .references("id")
      .inTable("campaign_contact");
    t.timestamp("created_at").defaultTo(knex.fn.now());

    t.index(
      // putting contact_number first, in-case queries can ever span organizations
      ["campaign_contact_id", "canned_response_id"],
      "canned_response_send_campaign_contact_id_canned_response_id"
    );
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("canned_response_send");
};
