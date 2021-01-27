exports.up = async function up(knex, Promise) {
  await knex.schema.alterTable("message", t => {
    t.index(["contact_number", "user_number"], "cell_user_number_idx");
  });

  await knex.schema.table("owned_phone_number", table => {
    table
      .integer("stuck_contacts")
      .notNullable()
      .defaultTo(0);
  });

  if (!(await knex.schema.hasTable("organization_contact"))) {
    await knex.schema.createTable("organization_contact", t => {
      t.increments("id");
      t.text("organization_id");
      t.text("contact_number");
      t.text("user_number");

      t.index(
        ["organization_id", "contact_number"],
        "organization_contact_organization_contact_number"
      );

      t.unique(["organization_id", "contact_number"]);
    });
  }
};

exports.down = async function down(knex, Promise) {
  await knex.schema.alterTable("message", t => {
    t.dropIndex("cell_user_number_idx");
  });

  await knex.schema.alterTable("owned_phone_number", t => {
    t.dropColumn("stuck_contacts");
  });

  await knex.schema.dropTableIfExists("organization_contact");
};
