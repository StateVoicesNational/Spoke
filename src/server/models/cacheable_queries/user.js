import { r } from '../../models'

import { getHighestRole } from '../../../lib/permissions'

export async function userHasRole(userId, orgId, acceptableRoles) {
  if (r.redis) {
    // cached approach
    const userKey = `texterinfo-${userId}`
    let highestRole = await r.redis.hgetAsync(userKey, orgId)
    if (!highestRole) {
      // need to get it from db, and then cache it
      const userRoles = await r.knex('user_organization')
        .where({ user_id: userId,
                 organization_id: orgId })
        .select('role')
      if (!userRoles.length) {
        return false // who is this imposter!?
      }
      highestRole = getHighestRole(userRoles.map((r) => r.role))
      await r.redis.hsetAsync(userKey, orgId, highestRole)
    }
    return (acceptableRoles.indexOf(highestRole) >= 0)
  } else {
    // regular DB approach
    const userHasRole = await r.getCount(
      r.knex('user_organization')
        .where({ user_id: userId,
                 organization_id: orgId })
        .whereIn('role', acceptableRoles)
    )
    return userHasRole
  }
}

export async function userLoggedIn(authId) {
  const authKey = `texterauth-${authId}`

  if (r.redis) {
    const cachedAuth = await r.redis.getAsync(authKey)
    if (cachedAuth) {
      return JSON.parse(cachedAuth)
    }
  }

  const userAuth = await r.knex('user')
    .where('auth0_id', authId)
    .select('*')
    .first()

  if (r.redis && userAuth) {
    await r.redis.multi()
      .set(authKey, JSON.stringify(userAuth))
      .expire(authKey, 86400)
      .exec()
  }
  return userAuth
}

export async function updateAssignments(campaignInfo) {
  const campaignId = campaignInfo.id
  const dynamicAssignment = campaignInfo.use_dynamic_assignment
  if (r.redis) {
    const texters = await r.knex('assignment')
      .select('user_id', 'id')
      .where('campaign_id', campaignId)

    if (dynamicAssignment) {
      for (let i = 0; i < texters.length; i++) {
        // value is the actual assignments available for this campaign
        let availableAssignments = ``
        let dynamicAssignmentKey = `dynamicassignments-${campaignId}`
        await r.redis.lpush(dynamicAssignmentKey, availableAssignments)
      }
    }

    if (!dynamicAssignment) {
      for (let i = 0; i < texters.length; i++) {
        let texterId = texters[i].user_id
        let assignmentId = texters[i].id
        let texterAssignmentKey = `newassignments-${texterId}-${campaignId}`
        let texterAssignment = `textercontactslist`
        const assignments = await r.knex('campaign_contact')
          .where('assignment_id', assignmentId)

        console.log('assignments for this texter:', JSON.stringify(assignments));
        // value is the acutal assignment for a specific texter
        await r.redis.lpush(texterAssignmentKey, texterAssignment)
      }
    }
  }
}
