import { r } from "../../models";

/*
KEY: tags-<campaignContactId>
value = JSON-string array: [{id, name}...]
*/

const tagCacheKey = campaignContactId =>
  `${process.env.CACHE_PREFIX || ""}tags-${campaignContactId}`;

const CONTACT_CACHE_ENABLED =
  process.env.REDIS_CONTACT_CACHE || global.REDIS_CONTACT_CACHE;

export const loadToCache = async campaignContactId => {
  const tagValues = await r
    .knex("tag_campaign_contact")
    .where("campaign_contact_id", campaignContactId)
    .select("campaign_contact_id", "value", "tag_id as id");

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

export const tagCampaignContactCache = {
  query: async ({ campaignContactId, minimalObj, includeResolved }) => {
    // console.log('query tag cache', campaignContactId)
    // For now, minimalObj is always being invoked as true in
    // server/api/campaign-contact
    if (r.redis && CONTACT_CACHE_ENABLED && minimalObj) {
      const cacheKey = tagCacheKey(campaignContactId);
      const cachedResponse = await r.redis.getAsync(cacheKey);
      if (cachedResponse) {
        return JSON.parse(cachedResponse)
          .filter(t => includeResolved || t.value !== "RESOLVED")
          .map(t => ({
            ...t,
            campaign_contact_id: campaignContactId
          }));
      }
    }
    return (await exports.loadToCache(campaignContactId)).filter(
      t => includeResolved || t.value !== "RESOLVED"
    );
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

    const existingTags = await tagCampaignContactCache.query({
      campaignContactId,
      minimalObj: true,
      includeResolved: true
    });

    const allTagsById = {};
    const updatedTagsById = {};
    const newTagsById = {};

    existingTags.forEach(existingTag => {
      allTagsById[existingTag.id] = existingTag.value;
    });

    tags.forEach(tag => {
      if (tag.id) {
        if (tag.id.toString() in allTagsById) {
          updatedTagsById[tag.id] = tag.value;
        } else {
          newTagsById[tag.id] = tag.value;
        }
        allTagsById[tag.id] = tag.value;
      }
    });

    const toArray = tagDictionary => {
      return Object.entries(tagDictionary).map(([tagId, value]) => ({
        tag_id: tagId,
        campaign_contact_id: campaignContactId,
        value: value || null
      }));
    };

    const newTags = toArray(newTagsById);
    const updatedTags = toArray(updatedTagsById);
    const allTags = toArray(allTagsById);

    await r.knex.transaction(async trx => {
      const promises = updatedTags.map(tag => {
        return trx("tag_campaign_contact")
          .update({ value: tag.value || null })
          .where({
            tag_id: tag.tag_id,
            campaign_contact_id: campaignContactId
          });
      });
      if (newTags.length) {
        const insertPromise = trx("tag_campaign_contact").insert(newTags);
        promises.push(insertPromise);
      }

      await Promise.all(promises);
    });
    if (r.redis && CONTACT_CACHE_ENABLED) {
      const cacheKey = tagCacheKey(campaignContactId);
      await r.redis
        .multi()
        .set(
          cacheKey,
          JSON.stringify(
            allTags.map(t => ({
              value: t.value || null,
              id: Number(t.tag_id)
            }))
          )
        )
        .expire(cacheKey, 43200)
        .execAsync();
    }
  },
  reloadQuery: async campaignContactId => {
    if (r.redis && CONTACT_CACHE_ENABLED) {
      await exports.loadToCache(campaignContactId);
    }
  }
};
