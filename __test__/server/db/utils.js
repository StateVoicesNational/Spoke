export const tables = [
  "log",
  "message",
  "user_cell",
  "job_request",
  "pending_message_part",
  "zip_code",
  "area_code",
  "invite",
  "user",
  "user_organization",
  "campaign",
  "interaction_step",
  "assignment",
  "organization",
  "canned_response",
  "opt_out",
  "question_response",
  "campaign_contact",
  "tag",
  "tag_canned_response"
];

// Adapted from https://dba.stackexchange.com/a/37068
export const indexQuery = `SELECT conrelid::regclass AS table_from
   , conname
   , pg_get_constraintdef(c.oid)
FROM   pg_constraint c
JOIN   pg_namespace n ON n.oid = c.connamespace
WHERE  contype IN ('f', 'p ')
AND    conrelid::regclass::text <> 'migrations'
AND    conrelid::regclass::text <> 'knex_migrations'
AND    conrelid::regclass::text <> 'knex_migrations_lock'
AND    n.nspname = 'public'
ORDER  BY conrelid::regclass::text, contype DESC;`;
