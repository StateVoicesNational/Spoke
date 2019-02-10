export const tables = [
  'log',
  'message',
  'user_cell',
  'job_request',
  // 'migrations' // Now automatically managed by Knex
  'pending_message_part',
  'zip_code',
  'invite',
  'user',
  'user_organization',
  'campaign',
  'interaction_step',
  'assignment',
  'organization',
  'canned_response',
  'opt_out',
  'question_response',
  'campaign_contact'
]

export const indexQuery = `SELECT conrelid::regclass AS table_from
   , conname
   , pg_get_constraintdef(c.oid)
FROM   pg_constraint c
JOIN   pg_namespace n ON n.oid = c.connamespace
WHERE  contype IN ('f', 'p ')
AND    conrelid::regclass::text <> 'migrations'
AND    n.nspname = 'public'
ORDER  BY conrelid::regclass::text, contype DESC;`
