const helpers = require("./helpers");

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
    table.string("phone_number").notNullable();
    table
      .string("area_code")
      .notNullable()
      .index();

    // organization_messaging_service, global_messaging_service, etc..
    table.string("allocated_to").nullable();
    table.string("allocated_to_id").nullable();
    table.timestamp("allocated_at").nullable();

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.unique(["service", "service_id"]);
  });

  // ALLOW ORG-SCOPED JOBS
  if (helpers.isSqlite(knex)) {
    await helpers.redefineSqliteTable(knex, "job_request", t => {
      t.increments("id");
      t.integer("campaign_id").nullable();
      t.integer("organization_id")
        .nullable()
        .references("id")
        .inTable("organization")
        .index();
      t.text("payload").notNullable();
      t.text("queue_name").notNullable();
      t.text("job_type").notNullable();
      t.text("result_message").defaultTo("");
      t.boolean("locks_queue").defaultTo(false);
      t.boolean("assigned").defaultTo(false);
      t.integer("status").defaultTo(0);
      t.timestamp("updated_at")
        .notNullable()
        .defaultTo(knex.fn.now());
      t.timestamp("created_at")
        .notNullable()
        .defaultTo(knex.fn.now());

      t.index("queue_name");
      t.foreign("campaign_id").references("campaign.id");
    });
  } else {
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

  if (helpers.isSqlite(knex)) {
    await helpers.redefineSqliteTable(knex, "job_request", t => {
      t.increments("id");
      t.integer("campaign_id").notNullable();
      t.text("payload").notNullable();
      t.text("queue_name").notNullable();
      t.text("job_type").notNullable();
      t.text("result_message").defaultTo("");
      t.boolean("locks_queue").defaultTo(false);
      t.boolean("assigned").defaultTo(false);
      t.integer("status").defaultTo(0);
      t.timestamp("updated_at")
        .notNullable()
        .defaultTo(knex.fn.now());
      t.timestamp("created_at")
        .notNullable()
        .defaultTo(knex.fn.now());

      t.index("queue_name");
      t.foreign("campaign_id").references("campaign.id");
    });
  } else {
    await knex.schema.alterTable("job_request", table => {
      table.dropColumn("organization_id");
      table
        .integer("campaign_id")
        .alter()
        .notNullable();
    });
  }
};
