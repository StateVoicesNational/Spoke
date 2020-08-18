exports.up = async knex => {
  await knex.schema.createTable("tag_canned_response", table => {
    table.increments();
    table
      .integer("canned_response_id")
      .notNullable()
      .references("id")
      .inTable("canned_response")
      .index();
    table
      .integer("tag_id")
      .notNullable()
      .references("id")
      .inTable("tag");

    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.unique(["canned_response_id", "tag_id"]);
  });
};

exports.down = async knex => {
  await knex.schema.dropTable("tag_canned_response");
};
