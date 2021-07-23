import { r } from "../../models";

const cacheKey = id => `${process.env.CACHE_PREFIX || ""}a-${id}`;

const load = async id => {
  if (r.redis) {
    const cachedData = await r.redis.getAsync(cacheKey(id));
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  }
  const dbResult = await r
    .knex("assignment")
    .where("id", id)
    .first();
  if (r.redis) {
    await r.redis
      .multi()
      .set(cacheKey(id), JSON.stringify(dbResult))
      .expire(cacheKey(id), 14400) // 4 hours
      .execAsync();
  }
  return dbResult;
};

const assignmentCache = {
  clear: async id => {
    if (r.redis) {
      await r.redis.delAsync(cacheKey(id));
    }
  },
  hasAssignment: async (userId, assignmentId) => {
    const assignment = await load(assignmentId);
    // assignment is also last so it's returned
    return assignment && assignment.user_id === Number(userId) && assignment;
  },
  load
};

export default assignmentCache;
