import { r } from "../../models";

/*
KEY: qresponse-<campaignContactId>
value = JSON-string array: [{value, interaction_step_id}...]
*/

const responseCacheKey = campaignContactId =>
  `${process.env.CACHE_PREFIX || ""}qresponse-${campaignContactId}`;

const CONTACT_CACHE_ENABLED =
  process.env.REDIS_CONTACT_CACHE || global.REDIS_CONTACT_CACHE;

const loadToCache = async campaignContactId => {
  const questionResponseValues = await r
    .knex("question_response")
    .where("question_response.campaign_contact_id", campaignContactId)
    .select("value", "interaction_step_id");
  if (r.redis && CONTACT_CACHE_ENABLED) {
    const cacheKey = responseCacheKey(campaignContactId);
    await r.redis
      .multi()
      .set(cacheKey, JSON.stringify(questionResponseValues))
      .expire(cacheKey, 43200)
      .execAsync();
  }
  return questionResponseValues;
};

const questionResponseCache = {
  query: async (campaignContactId, minimalObj) => {
    // console.log('query questionresponse cache', campaignContactId)
    // For now, minimalObj is always being invoked as true in
    // server/api/campaign-contact
    if (r.redis && CONTACT_CACHE_ENABLED && minimalObj) {
      const cacheKey = responseCacheKey(campaignContactId);
      const cachedResponse = await r.redis.getAsync(cacheKey);
      if (cachedResponse) {
        return JSON.parse(cachedResponse);
      }
    }
    return await loadToCache(campaignContactId);
  },
  clearQuery: async campaignContactId => {
    // console.log('clearing questionresponse cache', campaignContactId)
    if (r.redis) {
      await r.redis.delAsync(responseCacheKey(campaignContactId));
    }
  },
  save: async (campaignContactId, questionResponses) => {
    // This is a bit elaborate because we want to preserve the created_at time
    // Otherwise, we could just delete all and recreate
    if (!campaignContactId) {
      return; // guard for delete command
    }
    const deleteQuery = r
      .knex("question_response")
      .where("campaign_contact_id", campaignContactId)
      .delete();
    if (!questionResponses.length) {
      await deleteQuery;
    } else {
      try {
        await r.knex.transaction(async trx => {
          const dbResponses = await r
            .knex("question_response")
            .transacting(trx)
            .forUpdate()
            .where("question_response.campaign_contact_id", campaignContactId)
            .select("value", "interaction_step_id");
          const insertQuestionResponses = [];
          const updateStepIds = [];
          const newIds = {};
          questionResponses.forEach(qr => {
            newIds[qr.interactionStepId] = 1;
            const existing = dbResponses.filter(
              db => db.interaction_step_id === Number(qr.interactionStepId)
            );
            const newObj = {
              campaign_contact_id: campaignContactId,
              interaction_step_id: qr.interactionStepId,
              value: qr.value
            };
            if (!existing.length) {
              insertQuestionResponses.push(newObj);
            } else if (existing[0].value !== qr.value) {
              updateStepIds.push(qr.interactionStepId);
              // will be both deleted and inserted
              insertQuestionResponses.push(newObj);
            }
          });
          const deletes = dbResponses
            .map(db => db.interaction_step_id)
            .filter(id => !(id in newIds));
          deletes.push(...updateStepIds);
          if (deletes.length) {
            await deleteQuery
              .transacting(trx)
              .whereIn("interaction_step_id", deletes);
          }
          if (insertQuestionResponses.length) {
            await r
              .knex("question_response")
              .transacting(trx)
              .insert(insertQuestionResponses);
          }
          await trx.commit();
        });
      } catch (error) {
        console.log("questionResponse cache transaction error", error);
      }
    }
    if (r.redis && CONTACT_CACHE_ENABLED) {
      const cacheKey = responseCacheKey(campaignContactId);
      await r.redis
        .multi()
        .set(
          cacheKey,
          JSON.stringify(
            questionResponses.map(qr => ({
              value: qr.value,
              interaction_step_id: Number(qr.interactionStepId)
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

export default questionResponseCache;
