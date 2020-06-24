import { r } from "../../models";

/*
KEY: tags-<campaignContactId>
value = JSON-string array: [{id, name}...]
*/

const tagCacheKey = campaignContactId =>
  `${process.env.CACHE_PREFIX || ""}tags-${campaignContactId}`;

const CONTACT_CACHE_ENABLED =
  process.env.REDIS_CONTACT_CACHE || global.REDIS_CONTACT_CACHE;

const loadToCache = async campaignContactId => {
  const tagValues = await r
    .knex("tag_campaign_contact")
    .where("campaign_contact_id", campaignContactId)
    .select("value", "tag_id as id");
  if (r.redis && CONTACT_CACHE_ENABLED) {
    const cacheKey = tagCacheKey(campaignContactId);
    await r.redis
      .multi()
      .set(cacheKey, JSON.stringify(tagValues))
      .expire(cacheKey, 43200)
      .execAsync();
  }
  return tagValues;
};

const tagCampaignContactCache = {
  query: async (campaignContactId, minimalObj) => {
    // console.log('query tag cache', campaignContactId)
    // For now, minimalObj is always being invoked as true in
    // server/api/campaign-contact
    if (r.redis && CONTACT_CACHE_ENABLED && minimalObj) {
      const cacheKey = tagCacheKey(campaignContactId);
      const cachedResponse = await r.redis.getAsync(cacheKey);
      if (cachedResponse) {
        return JSON.parse(cachedResponse);
      }
    }
    return await loadToCache(campaignContactId);
  },
  clearQuery: async campaignContactId => {
    if (r.redis) {
      await r.redis.delAsync(tagCacheKey(campaignContactId));
    }
  },
  save: async (campaignContactId, tags) => {
    // Note: currently this allows tagging multiple times
    // It's simpler, but queries need to do DISTINCT for results
    if (!campaignContactId || !tags || !tags.length) {
      return;
    }
    await r.knex("tag_campaign_contact").insert(
      tags
        .filter(t => t.id)
        .map(t => ({
          tag_id: t.id,
          campaign_contact_id: campaignContactId,
          value: t.value || null
        }))
    );
    if (r.redis && CONTACT_CACHE_ENABLED) {
      const cacheKey = tagCacheKey(campaignContactId);
      const existingTags = await r.redis.getAsync(cacheKey);
      if (existingTags) {
        tags.push(...JSON.parse(existingTags));
      }
      await r.redis
        .multi()
        .set(
          cacheKey,
          JSON.stringify(
            tags.map(t => ({
              value: t.value || null,
              id: Number(t.id)
            }))
          )
        )
        .expire(cacheKey, 43200)
        .execAsync();
    }
  },
  reloadQuery: async campaignContactId => {
    if (r.redis && CONTACT_CACHE_ENABLED) {
      await loadToCache(campaignContactId);
    }
  }
};

export default tagCampaignContactCache;
