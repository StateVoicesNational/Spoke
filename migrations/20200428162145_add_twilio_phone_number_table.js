exports.up = async knex => {
  // PHONE NUMBER TABLE:
  await knex.schema.createTable("twilio_phone_number", table => {
    table.string("sid").primary();
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

    // TODO: add the following if we want to be able to manage
    //   messaging services that don't belong to campaigns:
    // table.string("messaging_service_sid").index();

    // TODO: add the following two columns for a per-campaign phone number reservation system:
    // table
    //     .integer("campaign_id")
    //     .nullable()
    //     .references("id")
    //     .inTable("campaign")
    //     .index();
    // table.timestamp("reserved_at").nullable();

    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  // ALLOW ORG-SCOPED JOBS
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
};

exports.down = async knex => {
  await knex.schema.dropTable("twilio_phone_number");
  await knex("job_request")
    .whereNull("campaign_id")
    .delete();
  await knex.schema.alterTable("job_request", table => {
    table.dropColumn("organization_id");
    table
      .integer("campaign_id")
      .alter()
      .notNullable();
  });
};
