// Add campaign_contact_id column to message
exports.up = function(knex) {
  return knex.schema.alterTable("message", table => {
    table.integer("campaign_contact_id").unsigned();
    table.foreign("campaign_contact_id").references("campaign_contact.id");
    table.text("messageservice_sid");
    if (!/sqlite/.test(knex.client.config.client)) {
      table
        .integer("assignment_id")
        .nullable()
        .alter();
    }
    //table.index("campaign_contact_id"); // wait to do this in a second migration
  });
};

// Drop campaign_contact_id column from message
exports.down = function(knex) {
  return knex.schema.alterTable("message", table => {
    table.dropForeign("campaign_contact_id");
    table.dropColumn("campaign_contact_id");
    table.dropColumn("messageservice_sid");
    if (!/sqlite/.test(knex.client.config.client)) {
      table
        .integer("assignment_id")
        .notNullable()
        .alter();
    }
  });
};
