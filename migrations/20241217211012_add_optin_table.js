/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async knex => {
    await knex.schema.hasTable("opt_in").then(async exists => {
        if (exists) return;
        await knex.schema.createTable("opt_in", table => {
            table.increments("id")
            table.text("cell").notNullable();
            table.integer("assignment_id").nullable();;
            table.integer("organization_id").notNullable();
            // Not in love with "reason_code", but doing so to match
            // opt_out table
            table.text("reason_code").notNullable().defaultTo("");
            table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

            table.index("cell");
            table.index("assignment_id");
            table.foreign("assignment_id").references("assignment.id");
            table.index("organization_id");
            table.foreign("organization_id").references("organization.id")
        });
    });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async function(knex) {
    return await knex.schema.dropTableIfExists("opt_in");
};
