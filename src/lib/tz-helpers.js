import { isClient } from "./is-client";

export function getProcessEnvTz(defaultTimezone) {
  // TZ is a reserved env var in Lambda and always returns :UTC
  return (
    defaultTimezone ||
    (process.env.TZ === ":UTC"
      ? process.env.DEFAULT_TZ
      : process.env.DEFAULT_TZ || process.env.TZ)
  );
}

export function getProcessEnvDstReferenceTimezone() {
  if (isClient()) {
    return window.DST_REFERENCE_TIMEZONE;
  }

  return (
    process.env.DST_REFERENCE_TIMEZONE ||
    global.DST_REFERENCE_TIMEZONE ||
    "America/New_York"
  );
}
