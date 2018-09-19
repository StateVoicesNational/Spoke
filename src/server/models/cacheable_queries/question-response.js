/*
questionResponseValues: async (campaignContact, _, { loaders }) => {
  if (campaignContact.message_status === 'needsMessage') {
    return [] // it's the beginning, so there won't be any
  }
  return await r.knex('question_response')
    .where('question_response.campaign_contact_id', campaignContact.id)
    .select('value', 'interaction_step_id')
}
*/

import { r } from '../../models'

const responseCacheKey = (campaignContactId) => (
  `${process.env.CACHE_PREFIX || ''}response-${campaignContactId}`
)

const questionResponseCache = {
  query: async (campaignContactId, minimalObj) => {
    if (r.redis && minimalObj) {
      return await r.redis.hgetallAsync(responseCacheKey(campaignContactId))
    }
    return await r.knex('question_response')
      .where('question_response.campaign_contact_id', campaignContactId)
      .select('value', 'interaction_step_id')
  },
  clearQuery: async (campaignContactId) => {
    if (r.redis) {
      await r.redis.delAsync(responseCacheKey(campaignContactId))
    }
  },
  reloadQuery: async (campaignContactId) => {
    const questionResponseValues = await r.knex('question_response')
      .where('question_response.campaign_contact_id', campaignContactId)
      .select('value', 'interaction_step_id')

    if (r.redis) {
      const cacheKey = responseCacheKey(campaignContactId)
      await r.redis.multi()
        .del(cacheKey)
        .hmset(cacheKey, ...questionResponseValues)
        .expire(cacheKey, 86400)
        .execAsync()
    }
  }
}

export default questionResponseCache
