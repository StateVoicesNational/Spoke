import { r } from "../../models";

export const clearEntireRedisCache = async (
  _,
  {adminPerms}
)   => {
  if (! adminPerms) {
    return "You must have be an administrator to clear the Redis cache"
  }
  if (!r.redis) {
    return "Redis not configured.";
  }

  try {
    await r.redis.FLUSHDB()
  } catch (caught) {
    // eslint-disable-next-line no-console
    console.error(`Error while clearing Redis cache. ${caught}`);
  }
}
