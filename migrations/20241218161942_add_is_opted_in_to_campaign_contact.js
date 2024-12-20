/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async knex => {
    await knex.schema.alterTable("campaign_contact", table => {
        table
            .boolean("is_opted_in")
            .defaultTo(false);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async knex => {
    const isSqlite = /sqlite/.test(knex.client.config.client);
    if (!isSqlite) {
        await knex.schema.alterTable("campaign_contact", table => {
            table
                .boolean("is_opted_in")
                .defaultTo(false);
        });
    }
};
