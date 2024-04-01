import dumbThinky from "rethink-knex-adapter";
import bluebird from "bluebird";
import knex from "knex";
import config from "../knex-connect";

// Instantiate the rethink-knex-adapter using the config defined in
// /src/server/knex.js.
const knexConn = knex(config);
const thinkyConn = dumbThinky(config, knexConn);

if (
  (process.env.DB_READONLY_HOST || process.env.READONLY_DATABASE_URL) &&
  config.connection
) {
  const roConfig = {
    ...config,
    connection: process.env.READONLY_DATABASE_URL || {
      ...config.connection,
      host: process.env.DB_READONLY_HOST
    }
  };
  thinkyConn.r.knexReadOnly = knex(roConfig);
} else {
  thinkyConn.r.knexReadOnly = thinkyConn.r.knex;
}

thinkyConn.r.getCount = async query => {
  // helper method to get a count result
  // with fewer bugs.  Using knex's .count()
  // results in a 'count' key on postgres, but a 'count(*)' key
  // on sqlite -- ridiculous.  This smooths that out
  if (Array.isArray(query)) {
    return query.length;
  }
  return Number((await query.count("* as count").first()).count);
};

thinkyConn.r.getCountDistinct = async (query, distinctConstraint) =>
  Number(
    (await query.countDistinct(distinctConstraint + " as count").first()).count
  );

const redisUrl = process.env.REDIS_TLS_URL || process.env.REDIS_URL;

if (redisUrl) {
  // new redis client doesn't respect username placeholders so replace it
  // this is especially true for legacy Heroku instances which had redis://h:<password>...
  const redisSettings = {
    url: redisUrl.replace(/redis:\/\/\w+:/, "redis://:")
  };
  if (/rediss/.test(redisSettings.url)) {
    // secure redis protocol for Redis 6.0+
    // https://devcenter.heroku.com/articles/securing-heroku-redis#using-node-js
    redisSettings.tls = {
      rejectUnauthorized: false,
      requestCert: true,
      agent: false
    };
  }
  if (process.env.REDIS_JSON) {
    Object.assign(redisSettings, JSON.parse(process.env.REDIS_JSON));
  }

  const redis = require("redis");
  thinkyConn.r.redis = redis.createClient(redisSettings);
  (async () => {
    await thinkyConn.r.redis.connect();
  })();
} else if (process.env.REDIS_FAKE) {
  const fakeredis = require("fakeredis");

  thinkyConn.r.redis = fakeredis.createClient();
}

export default thinkyConn;
