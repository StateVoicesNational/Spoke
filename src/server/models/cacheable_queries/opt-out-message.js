import { r } from "../../models";

const orgCacheKey = orgId =>
  `${process.env.CACHE_PREFIX || ""}optoutmessages-${orgId}`;

const optOutMessageCache = {
  clearQuery: async ({ organizationId }) => {
    if (r.redis) {
      await r.redis.delAsync(orgCacheKey(organizationId));
    }
  },
  query: async ({ state, organizationId }) => {
    if (r.redis) {
      const hashKey = orgCacheKey(organizationId);
      const [exists, isMember] = await r.redis
        .multi()
        .exists(hashKey)
        .sismember(hashKey, message)
        .execAsync();
      if (exists) {
        return isMember;
      }
    }
    return await r
      .knex("opt_out_message")
      .select("message")
      .where({ state: state })
      .limit(1);
  }
};

export default optOutMessageCache;
