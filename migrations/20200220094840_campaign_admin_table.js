exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable("campaign_admin"))) {
    return knex.schema.createTable("campaign_admin", t => {
      t.increments("id");
      t.integer("campaign_id")
        .unsigned()
        .notNullable();
      t.text("ingest_method");
      t.text("ingest_data_reference");
      t.text("ingest_result");
      t.boolean("ingest_success");
      t.integer("contacts_count");
      t.integer("deleted_optouts_count");
      t.integer("duplicate_contacts_count");
      t.timestamp("updated_at")
        .notNullable()
        .defaultTo(knex.fn.now());
      t.timestamp("created_at")
        .notNullable()
        .defaultTo(knex.fn.now());

      t.index("campaign_id");
      t.foreign("campaign_id").references("campaign.id");
    });
  }
  return Promise.resolve();
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists("campaign_admin");
};
