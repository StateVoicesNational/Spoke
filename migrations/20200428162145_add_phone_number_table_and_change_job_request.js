exports.up = async knex => {
  await knex.schema.createTable("owned_phone_number", table => {
    table.increments();
    table.string("service"); // twilio, nexmo, etc...
    table.string("service_id"); // id of the phone number resource
    table
      .integer("organization_id")
      .notNullable()
      .references("id")
      .inTable("organization")
      .index();

    // TODO: Twilio account sid might be required
    // see: https://github.com/MoveOnOrg/Spoke/pull/1478/files

    table.string("phone_number").notNullable();
    table
      .string("area_code")
      .notNullable()
      .index();
    table.string("status").notNullable();

    table
      .integer("campaign_id")
      .nullable()
      .references("id")
      .inTable("campaign")
      .index();

    // TODO: May or may not be needed depending on how we implement
    // phone number selection in AdminCampaignEdit and startCampaign:
    // table.timestamp("reserved_at").nullable();

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.unique(["service", "service_id"]);
  });

  // ALLOW ORG-SCOPED JOBS
  const isSqlite = /sqlite/.test(knex.client.config.client);
  if (!isSqlite) {
    await knex.schema.alterTable("job_request", table => {
      table
        .integer("campaign_id")
        .alter()
        .nullable();
      table
        .integer("organization_id")
        .nullable()
        .references("id")
        .inTable("organization")
        .index();
    });
  }
};

exports.down = async knex => {
  await knex.schema.dropTable("owned_phone_number");
  await knex("job_request")
    .whereNull("campaign_id")
    .delete();

  const isSqlite = /sqlite/.test(knex.client.config.client);
  if (!isSqlite) {
    await knex.schema.alterTable("job_request", table => {
      table.dropColumn("organization_id");
      table
        .integer("campaign_id")
        .alter()
        .notNullable();
    });
  }
};
