// Add VETTED_TEXTER, ORG_SUPERADMIN, and SUSPENDED as a values in the `role` enumeration
exports.up = (knex, Promise) => {
  const isSqlite = /sqlite/.test(knex.client.config.client);
  if (isSqlite) {
    return Promise.resolve();
  }
  return knex.schema.raw(`
    ALTER TABLE "user_organization" DROP CONSTRAINT IF EXISTS "user_organization_role_check";
    ALTER TABLE "user_organization" ADD CONSTRAINT "user_organization_role_check" CHECK (role IN (
      'OWNER'::text,
      'ADMIN'::text,
      'SUPERVOLUNTEER'::text,
      'TEXTER'::text,
      'VETTED_TEXTER'::text,
      'ORG_SUPERADMIN'::text,
      'SUSPENDED'::text
    ))
  `);
};

exports.down = (knex, Promise) => {
  const isSqlite = /sqlite/.test(knex.client.config.client);
  if (isSqlite) {
    return Promise.resolve();
  }
  return knex.schema.raw(`
    ALTER TABLE "user_organization" DROP CONSTRAINT IF EXISTS "user_organization_role_check";
    ALTER TABLE "user_organization" ADD CONSTRAINT "user_organization_role_check" CHECK (role IN (
      'OWNER'::text,
      'ADMIN'::text,
      'SUPERVOLUNTEER'::text,
      'TEXTER'::text
    ))
`);
};
