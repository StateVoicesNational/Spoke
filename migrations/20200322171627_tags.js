exports.up = async knex => {
  const isSqlite = /sqlite/.test(knex.client.config.client);

  const buildTableSchema = [
    {
      tableName: "tag",
      create: t => {
        t.increments("id").primary();
        t.text("group");
        t.text("name").notNullable();
        t.text("description").notNullable();
        t.boolean("is_deleted").defaultTo(false);
        t.timestamp("created_at")
          .notNullable()
          .defaultTo(knex.fn.now());
        t.timestamp("updated_at")
          .notNullable()
          .defaultTo(knex.fn.now());
        t.integer("organization_id").notNullable();

        if (!isSqlite) {
          t.foreign("organization_id").references("organization.id");
          t.index(["organization_id", "is_deleted"]);
        }
      }
    },
    {
      tableName: "tag_campaign_contact",
      create: t => {
        t.increments("id").primary();
        t.text("value");
        t.integer("tag_id").notNullable();
        t.integer("campaign_contact_id").notNullable();
        t.timestamp("created_at")
          .notNullable()
          .defaultTo(knex.fn.now());
        t.timestamp("updated_at")
          .notNullable()
          .defaultTo(knex.fn.now());
        if (!isSqlite) {
          t.foreign("tag_id").references("tag.id");

          t.foreign("campaign_contact_id").references("campaign_contact.id");
          t.index("campaign_contact_id");
        }
      }
    }
  ];
  const tablePromises = [];
  for (let i = 0; i < buildTableSchema.length; i++) {
    const { tableName, create } = buildTableSchema[i];
    if (!(await knex.schema.hasTable(tableName))) {
      const newTable = await knex.schema.createTable(tableName, create);
      tablePromises.push(newTable);
    }
  }

  return Promise.all(tablePromises);
};

exports.down = knex => {
  return knex.schema
    .dropTableIfExists("tag_campaign_contact")
    .dropTableIfExists("tag");
};
