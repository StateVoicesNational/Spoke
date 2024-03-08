/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable("opt_out_message", table => {
    table.increments();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.text("message").notNullable();
    table
      .integer("organization_id")
      .references("id")
      .inTable("organization")
      .notNullable();
    table.string("state", 2).notNullable();

    table.index(
      ["organization_id", "state"],
      "opt_out_message_organization_id_state"
    );
    table.unique(["organization_id", "state"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists("opt_out_message");
};
