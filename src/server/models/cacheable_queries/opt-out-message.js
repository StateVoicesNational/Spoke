import { r } from "../../models";

const cacheKey = (orgId, state) =>
  `${process.env.CACHE_PREFIX || ""}optoutmessages-${orgId}-${state}`;

const optOutMessageCache = {
  clearQuery: async ({ organizationId, state }) => {
    if (r.redis) {
      await r.redis.delAsync(cacheKey(organizationId, state));
    }
  },
  query: async ({ organizationId, state }) => {
    async function getMessage() {
      const res = await r
        .knex("opt_out_message")
        .select("message")
        .where({ state: state })
        .limit(1);

      return res.length ? res[0].message : "";
    }
    if (r.redis) {
      const key = cacheKey(organizationId, state);
      let message = await r.redis.getAsync(key);

      if (message !== null) {
        return message;
      }

      message = await getMessage();

      await r.redis
        .multi()
        .set(key, message)
        .expire(key, 15780000) // 6 months
        .execAsync();

      return message;
    }

    return await getMessage();
  }
};

export default optOutMessageCache;
