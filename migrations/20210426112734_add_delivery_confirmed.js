// Add DELIVERED CONFIRMED as a value in the `send_status` enumeration
exports.up = knex => {
  const isSqlite = /sqlite/.test(knex.client.config.client);
  if (isSqlite) {
    return Promise.resolve();
  }
  return knex.schema.raw(`
    ALTER TABLE "message" DROP CONSTRAINT IF EXISTS "message_send_status_check";
    ALTER TABLE "message" ADD CONSTRAINT "message_send_status_check" CHECK (send_status IN (
      'QUEUED'::text,
      'SENDING'::text,
      'SENT'::text,
      'DELIVERED'::text,
      'DELIVERED CONFIRMED'::text,
      'ERROR'::text,
      'PAUSED'::text,
      'NOT_ATTEMPTED'::text
    ))
  `);
};

exports.down = knex => {
  const isSqlite = /sqlite/.test(knex.client.config.client);
  if (isSqlite) {
    return Promise.resolve();
  }
  return knex.schema.raw(`
    ALTER TABLE "message" DROP CONSTRAINT IF EXISTS "message_send_status_check";
    ALTER TABLE "message" ADD CONSTRAINT "message_send_status_check" CHECK (send_status IN (
      'QUEUED'::text,
      'SENDING'::text,
      'SENT'::text,
      'DELIVERED'::text,
      'ERROR'::text,
      'PAUSED'::text,
      'NOT_ATTEMPTED'::text
    ))
  `);
};
