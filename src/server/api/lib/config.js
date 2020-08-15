import fs from "fs";

// This is for centrally loading config from different environment sources
// Especially for large config values (or many) some environments (like AWS Lambda) limit
// the size of environment variable data -- and thus, we can load it from a config file instead.
// There is also common confusion around global.* (set in tests) vs. process.env.* (dev and prod envs)
// This is meant to simplify this at least for places that want to avoid embedded logic.

let CONFIG = null;

export function getFeatures(organization) {
  if (!organization) {
    return {};
  }
  return (
    organization.feature ||
    (organization.features &&
      typeof organization.features == "string" &&
      JSON.parse(organization.features)) ||
    organization.features ||
    {}
  );
}

export const getOrDefault = (value, defaultValue) =>
  value === "" ? defaultValue : value;

export function getConfig(key, organization, opts) {
  if (organization) {
    // TODO: update to not parse if features is an object (vs. a string)
    let features = getFeatures(organization);
    if (features.hasOwnProperty(key)) {
      return getOrDefault(features[key], opts && opts.default);
    }
  }
  if (opts && opts.onlyLocal) {
    return opts.default;
  }
  if (key in global) {
    if (opts && opts.truthy) {
      return Boolean(
        global[key] && global[key] !== "0" && global[key] !== "false"
      );
    }
    return getOrDefault(global[key], opts && opts.default);
  } else if (key in process.env) {
    if (opts && opts.truthy) {
      return Boolean(
        process.env[key] &&
          process.env[key] !== "0" &&
          process.env[key] !== "false"
      );
    }
    return getOrDefault(process.env[key], opts && opts.default);
  } else if (CONFIG && key in CONFIG) {
    return getOrDefault(CONFIG[key], opts && opts.default);
  } else if (opts && opts.truthy) {
    return false;
  }
  return opts && opts.default;
}

export function hasConfig(key, organization) {
  const val = getConfig(key, organization);
  // we need to allow "" as no config since env vars will occasionally be set to that to undefine it
  return Boolean(typeof val !== "undefined" && val !== "");
}

if (CONFIG === null && process.env.CONFIG_FILE) {
  // in lambda localDir will be "/var/task" where __dirname is /var/task/build/server/server
  const localDir = process.cwd();
  console.log("CONFIG FILE", process.env.CONFIG_FILE, process.cwd(), __dirname);
  if (fs.existsSync(process.env.CONFIG_FILE)) {
    console.log("CONFIG FILE EXISTS at location");
    CONFIG = JSON.parse(fs.readFileSync(process.env.CONFIG_FILE, "utf8"));
  } else if (
    process.env.NODE_ENV === "production" &&
    fs.existsSync(`${localDir}/CONFIG_FILE.json`)
  ) {
    console.log("CONFIG FILE EXISTS locally");
    CONFIG = JSON.parse(
      fs.readFileSync(`${localDir}/CONFIG_FILE.json`, "utf8")
    );
  }
}
