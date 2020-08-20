exports.up = async function up(knex, Promise) {
  if (!(await knex.schema.hasTable("contact_user_number"))) {
    return knex.schema.createTable("contact_user_number", t => {
      t.increments("id");
      t.text("organization_id");
      t.text("contact_number");
      t.text("user_number");

      t.index(
        ["organization_id", "contact_number"],
        "contact_user_number_organization_contact_number"
      );

      t.unique(["organization_id", "contact_number"]);

      knex
        .table("message")
        .index(["contact_number", "user_number"], "cell_user_number_idx");
    });
  }

  return Promise.resolve();
};

exports.down = function down(knex, Promise) {
  return knex.schema.dropTableIfExists("contact_user_number");
};
