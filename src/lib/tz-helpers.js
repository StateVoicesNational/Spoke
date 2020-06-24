import { isClient } from "./is-client";

export function getProcessEnvTz() {
  // TZ is a reserved env var in Lambda and always returns :UTC
  return process.env.TZ === ":UTC" ? "UTC" : process.env.TZ;
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
