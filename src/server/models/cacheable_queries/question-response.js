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
      .MULTI()
      .SET(cacheKey, JSON.stringify(questionResponseValues))
      .EXPIRE(cacheKey, 43200)
      .exec();
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
      const cachedResponse = await r.redis.GET(cacheKey);
      if (cachedResponse) {
        return JSON.parse(cachedResponse);
      }
    }
    return await loadToCache(campaignContactId);
  },
  clearQuery: async campaignContactId => {
    // console.log('clearing questionresponse cache', campaignContactId)
    if (r.redis) {
      await r.redis.DEL(responseCacheKey(campaignContactId));
    }
  },
  save: async (campaignContactId, questionResponses) => {
    // This is a bit elaborate because we want to preserve the created_at time
    // Otherwise, we could just delete all and recreate
    const toReturn = {
      newOrUpdated: {},
      deleted: []
    };
    if (!campaignContactId) {
      return toReturn; // guard for delete command
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
          const newIds = {};
          const insertQuestionResponses = [];
          const updateStepIds = [];
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
              toReturn.newOrUpdated[Number(qr.interactionStepId)] = null;
            } else if (existing[0].value !== qr.value) {
              updateStepIds.push(qr.interactionStepId);
              toReturn.newOrUpdated[Number(qr.interactionStepId)] =
                existing[0].value;
              // will be both deleted and inserted
              insertQuestionResponses.push(newObj);
            }
          });
          const toDelete = dbResponses.filter(
            dbqr => !(dbqr.interaction_step_id in newIds)
          );
          toDelete.forEach(dbqr => {
            toReturn.deleted.push({
              value: dbqr.value,
              interactionStepId: dbqr.interaction_step_id
            });
          });
          const deletes = toDelete.map(db => db.interaction_step_id);
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
        // eslint-disable-next-line no-console
        console.log("questionResponse cache transaction error", error);
      }
    }
    if (r.redis && CONTACT_CACHE_ENABLED) {
      const cacheKey = responseCacheKey(campaignContactId);
      await r.redis
        .MULTI()
        .SET(
          cacheKey,
          JSON.stringify(
            questionResponses.map(qr => ({
              value: qr.value,
              interaction_step_id: Number(qr.interactionStepId)
            }))
          )
        )
        .EXPIRE(cacheKey, 43200)
        .exec();
    }

    return toReturn;
  },
  reloadQuery: async campaignContactId => {
    if (r.redis && CONTACT_CACHE_ENABLED) {
      await loadToCache(campaignContactId);
    }
  }
};

export default questionResponseCache;
