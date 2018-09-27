import { r } from '../../models'

/*
HASH: response-<campaignContactId>
key = question_response.interaction_step_id
value = question_response.value
*/

const responseCacheKey = (campaignContactId) => (
  `${process.env.CACHE_PREFIX || ''}response-${campaignContactId}`
)

const questionResponseCache = {
  query: async (campaignContactId, minimalObj) => {
    //console.log('query questionresponse cache', campaignContactId)
    // For now, minimalObj is always being invoked as true in
    // server/api/campaign-contact
    if (r.redis && minimalObj) {
      const cacheKey = responseCacheKey(campaignContactId)
      const [exists, cachedResponse] = await r.redis.multi()
        .exists(cacheKey)
        .hgetall(cacheKey)
        .execAsync()
      if (exists && cachedResponse) {
        const formattedResponse = Object.keys(cachedResponse).map((key) => ({
          interaction_step_id: key,
          value: cachedResponse[key]
        }))
        return formattedResponse
      }
    }
    return await r.knex('question_response')
      .where('question_response.campaign_contact_id', campaignContactId)
      .select('value', 'interaction_step_id')
  },
  clearQuery: async (campaignContactId) => {
    //console.log('clearing questionresponse cache', campaignContactId)
    if (r.redis) {
      await r.redis.delAsync(responseCacheKey(campaignContactId))
    }
  },
  reloadQuery: async (campaignContactId) => {
    if (r.redis) {
      const questionResponseValues = await r.knex('question_response')
        .where('question_response.campaign_contact_id', campaignContactId)
        .select('value', 'interaction_step_id')

      const valueInteractionArray = questionResponseValues.reduce((acc, qrv) => {
        acc.push(qrv.interaction_step_id, qrv.value)
        return acc
      }, [])

      const cacheKey = responseCacheKey(campaignContactId)
      await r.redis.multi()
        .del(cacheKey)
        .hmset(cacheKey, ...valueInteractionArray)
        .expire(cacheKey, 86400)
        .execAsync()
    }
  }
}

export default questionResponseCache
