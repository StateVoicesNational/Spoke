export function getProcessEnvTz() { return process.env.TZ; }

export function getProcessEnvDstReferenceTimezone() {
  return process.env.DST_REFERENCE_TIMEZONE || global.DST_REFERENCE_TIMEZONE || 'America/New_York'; }

