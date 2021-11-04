exports.up = async knex => {
  await knex.schema.createTable("assignment_feedback", table => {
    table.increments();
    table
      .integer("assignment_id")
      .notNullable()
      .references("id")
      .inTable("assignment");
    table
      .integer("creator_id")
      .nullable()
      .references("id")
      .inTable("user");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table
      .jsonb("feedback")
      .nullable()
      .defaultTo(null);
    table.boolean("is_acknowledged").defaultTo(false);
    table.boolean("complete").defaultTo(false);

    table.unique("assignment_id");
  });
};

exports.down = async knex => {
  await knex.schema.dropTable("assignment_feedback");
};
