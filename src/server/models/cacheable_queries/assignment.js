import { r } from "../../models";

const cacheKey = id => `${process.env.CACHE_PREFIX || ""}a-${id}`;

const load = async id => {
  if (r.redis) {
    const cachedData = await r.redis.get(cacheKey(id));
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
      .MULTI()
      .SET(cacheKey(id), JSON.stringify(dbResult))
      .EXPIRE(cacheKey(id), 14400) // 4 hours
      .exec();
  }
  return dbResult;
};

const assignmentCache = {
  clear: async id => {
    if (r.redis) {
      await r.redis.DEL(cacheKey(id));
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
