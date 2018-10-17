import { r } from '../../models'

// This file organizes two very-denormalized keys that track users, assignments, and campaigns
// The first is used to list texter todos.
// The second is scored by texter send-recency, and is used for dynamic assignments
//     to pop off stale inflight texters.

// SORTED SET
// A list of assignments per-user, for the user.todos api call
// This is just a library that will be used by assignment.js but contains userassignment data
const userCacheKey = (orgId, userId) => `${process.env.CACHE_PREFIX || ''}userassignment-${orgId}-${userId}`

// SORTED SET campaignassignments-<campaignId> with key=<userId>, score=<lastSent datetime>
//   score=0 means they have been unassigned the assignment
const campaignAssignmentsKey = (campaignId) => `${process.env.CACHE_PREFIX || ''}campaignassignments-${campaignId}`

export const getUserAssignments = async (organizationId, userId, assignmentLoader) => {
  const key = userCacheKey(organizationId, userId)
  // console.log('getUserAssignments', organizationId, userId, key)
  if (r.redis) {
    const [exists, assignmentIds] = await r.redis.multi()
      .exists(key)
      .zrangebyscore(key, 0, Infinity)
      .execAsync()
    if (exists) {
      if (assignmentLoader) {
        return await assignmentLoader(assignmentIds)
      }
      return assignmentIds.map(id => ({ id }))
    }
  }
  const dbRes = await r.table('assignment')
    .getAll(userId, { index: 'assignment.user_id' })
    .eqJoin('campaign_id', r.table('campaign'))
    .filter({ is_started: true,
              organization_id: organizationId,
              is_archived: false }
           )('left')
  if (r.redis) {
    const args = []
    dbRes.forEach(a => {
      // first argument is the SCORE, we keep it the same as the ID for now
      // but maybe we should make that e.g. a refresh time or something
      args.push(a.id, a.id)
    })
    if (args.length === 0) {
      args.push(-1, 'fakeval') // create empty if so
    }
    await r.redis.multi()
      .del(key)
      .zadd(key, args)
      .expire(key, 43200)
      .execAsync()
  }
  return dbRes
}

export const addUserAssignment = async (campaign, assignment) => {
  // We should ONLY add an assignment to the cache after the campaign is started
  // console.log('addUserAssignment', assignment.id, campaign.id, assignment.user_id)
  if (campaign.is_started && !campaign.is_archived) {
    if (r.redis) {
      const userKey = userCacheKey(campaign.organization_id, assignment.user_id)
      const campaignKey = campaignAssignmentsKey(assignment.campaign_id)
      // console.log('addUserAssignment', userKey, campaignKey)
      const [uExists, cExists] = await r.redis.multi()
      // two commands, because exists command just gives a count of each
        .exists(userKey).exists(campaignKey)
        .execAsync()
      // console.log('addUserAssignment3', uExists, cExists)
      if (uExists) {
        // first argument is the SCORE, we keep it the same as the ID for now
        await r.redis.multi()
          .zadd(userKey, assignment.id, assignment.id)
          .expire(userKey, 43200)
          .execAsync()
      }
      if (cExists) {
        await r.redis.multi()
          .zadd(campaignKey, 1, assignment.user_id)
          .expire(campaignKey, 43200)
          .execAsync()
      }
    }
  }
}

export const reloadCampaignTexters = async (campaignId) => {
  if (r.redis) {
    const key = campaignAssignmentsKey(campaignId)
    // console.log('reloadCampaignTexters', campaignId, key)
    const usersByUpdate = await r.knex('assignment')
      .select('assignment.user_id', r.knex.raw('max(message.created_at) as score'))
      .leftJoin('message', 'assignment.id', 'message.assignment_id')
      .where({ 'assignment.campaign_id': campaignId,
               'message.is_from_contact': true })
      .groupBy('assignment.user_id')
    const redisArgs = []
    usersByUpdate.forEach(res => {
      redisArgs.push(Number(res.score), res.user_id)
    })
    if (redisArgs.length === 0) {
      redisArgs.push(-1, 'fakeval') // create empty if so
    }
    await r.redis.multi()
      .del(key)
      .zadd(key, ...redisArgs)
      .expire(key, 43200)
      .execAsync()
  }
}

export const updateTexterLastActivity = async (campaignId, userId) => {
  if (r.redis) {
    const campaignKey = campaignAssignmentsKey(campaignId)
    const exists = await r.redis.existsAsync(campaignKey)
    if (exists) {
      await r.redis.multi()
        .zadd(campaignKey, Number(new Date()), userId)
        .expire(campaignKey, 43200)
        .execAsync()
    }
  }
}

const mapScoreResult = (redisResultArray) => {
  const mappedRes = []
  for (let i = 0, l = redisResultArray.length; i < l; i = i + 2) {
    mappedRes.push({
      id: redisResultArray[i],
      lastMessageTime: Number(redisResultArray[i + 1])
    })
  }
  return mappedRes
}

export const getCampaignTexterIds = async (campaignId, olderThanEpochMs) => {
  // console.log('getCampaignTexterIds', campaignId)
  if (r.redis) {
    const campaignKey = campaignAssignmentsKey(campaignId)
    // console.log('getCampaignTexterIds', campaignId, campaignKey)
    const zrangeArgs = [campaignKey, 0, olderThanEpochMs || Infinity, 'WITHSCORES']
    const [exists, cacheRes] = await r.redis.multi()
      .exists(campaignKey)
      .zrangebyscore(zrangeArgs)
      .execAsync()
    if (exists) {
      return mapScoreResult(cacheRes)
    }
    await reloadCampaignTexters(campaignId)
    return mapScoreResult(await r.redis.zrangebyscoreAsync(zrangeArgs))
  }
  return await r.knex('assignment')
    .select('user_id as id')
    .where('campaign_id', campaignId)
}

export const clearUserAssignments = async (organizationId, userIds, assignmentId, campaignId) => {
  if (r.redis) {
    // console.log('clearUserAssignments', organizationId, userIds, assignmentId, campaignId)
    if (assignmentId) {
      const key = userCacheKey(organizationId, userIds[0])
      await r.redis.zremAsync(key, 1, assignmentId)
    } else if (userIds && userIds.length) {
      const keys = userIds.map(u => userCacheKey(organizationId, u))
      await r.redis.delAsync(keys)
    }
    if (campaignId && userIds && userIds.length) {
      await r.redis.zremAsync(campaignAssignmentsKey(campaignId), userIds)
    }
  }
}
