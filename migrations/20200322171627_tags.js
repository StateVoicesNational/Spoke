exports.up = async knex => {
  const buildTableSchema = [
    {
      tableName: "tag",
      create: t => {
        t.increments("id").primary();
        t.text("title").notNullable();
        t.text("description").notNullable();
        t.boolean("is_deleted").defaultTo(false);
        t.timestamp("created_at")
          .notNullable()
          .defaultTo(knex.fn.now());
        t.timestamp("updated_at")
          .notNullable()
          .defaultTo(knex.fn.now());
        t.integer("organization_id").notNullable();
        t.foreign("organization_id").references("organization.id");
      }
    },
    {
      tableName: "tag_content",
      create: t => {
        t.increments("id").primary();
        t.text("value");
        t.integer("tag_id").notNullable();
        t.foreign("tag_id").references("tag.id");
        t.integer("message_id").notNullable();
        t.foreign("message_id").references("message.id");
        t.integer("campaign_id").notNullable();
        t.foreign("campaign_id").references("campaign.id");
        t.integer("campaign_contact_id").notNullable();
        t.foreign("campaign_contact_id").references("campaign_contact.id");
        t.timestamp("created_at")
          .notNullable()
          .defaultTo(knex.fn.now());
        t.timestamp("updated_at")
          .notNullable()
          .defaultTo(knex.fn.now());
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
  return knex.schema.dropTableIfExists("tag_content").dropTableIfExists("tag");
};
