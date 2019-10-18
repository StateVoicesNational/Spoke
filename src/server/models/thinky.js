import dumbThinky from "rethink-knex-adapter";
import redis from "redis";
import bluebird from "bluebird";
import config from "../knex-connect";

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

// Instantiate the rethink-knex-adapter using the config defined in
// /src/server/knex.js.
const thinkyConn = dumbThinky(config);

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

if (process.env.REDIS_URL) {
  thinkyConn.r.redis = redis.createClient({ url: process.env.REDIS_URL });
} else if (process.env.REDIS_FAKE) {
  const fakeredis = require("fakeredis");
  bluebird.promisifyAll(fakeredis.RedisClient.prototype);
  bluebird.promisifyAll(fakeredis.Multi.prototype);

  thinkyConn.r.redis = fakeredis.createClient();
}

export default thinkyConn;
