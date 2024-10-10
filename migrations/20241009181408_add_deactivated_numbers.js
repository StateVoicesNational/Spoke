/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  if (!(await knex.schema.hasTable("deactivated_numbers"))) {
    return knex.schema.createTable("deactivated_numbers", t => {
        t.increments('id');
        t.timestamp('date_deactivated')
            .notNullable();
        t.integer('phone_number')
            .notNullable();
    })
  }
  return Promise.resolve();
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async function(knex) {
    return await knex.schema.dropTableIfExists("deactivated_numbers");
};
