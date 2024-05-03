
const { onUpdateTrigger } = require('./helpers/index')
const ON_UPDATE_TIMESTAMP_FUNCTION = `
  CREATE OR REPLACE FUNCTION on_update_timestamp()
  RETURNS trigger AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
$$ language 'plpgsql';
`

const DROP_ON_UPDATE_TIMESTAMP_FUNCTION = `DROP FUNCTION on_update_timestamp`

/**
 * @param { import("knex").Knex } knex
 */
exports.up = async function(knex) {
    const isSqlite = /sqlite/.test(knex.client.config.client);
    if (!isSqlite) {
        await knex.raw(ON_UPDATE_TIMESTAMP_FUNCTION);
        await knex.raw(onUpdateTrigger('campaign_contact'));
    }
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async function(knex) {
    const isSqlite = /sqlite/.test(knex.client.config.client);
    if (!isSqlite) {
        await knex.raw("DROP TRIGGER campaign_contact_updated_at on campaign_contact");
        await knex.raw(DROP_ON_UPDATE_TIMESTAMP_FUNCTION);
    }
};
