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
    const texterAssignments = await r.knex('assignment')
      .select('user_id', 'id', 'max_contacts')
      .where('campaign_id', campaignId)

    const availableAssignments = await r.knex('campaign_contact')
      .select()
      .where({
        'campaign_id': campaignId,
        'is_opted_out': false,
        'message_status': 'needsMessage'
      })
      .then((res) => {
        console.log('res:', res);
      })

    if (dynamicAssignment) {
      for (let i = 0; i < texterAssignments.length; i++) {
        // value is the actual assignments available for this campaign
        const texterId = texterAssignments[i].user_id
        const maxContacts = texterAssignments[i].max_contacts
        const campaignContacts = availableAssignments
        const dynamicAssignmentKey = `dynamicassignments-${texterId}-${campaignId}`
        console.log('key:', dynamicAssignmentKey);
        console.log('value:', availableAssignments);

        await r.redis.lpush(dynamicAssignmentKey, availableAssignments)
      }
    }

    if (!dynamicAssignment) {
      for (let i = 0; i < texterAssignments.length; i++) {
        // value is the actual assignment for a specific texter
        const texterId = texterAssignments[i].user_id
        const assignmentId = texterAssignments[i].id
        const texterAssignmentKey = `newassignments-${texterId}-${campaignId}`
        const texterAssignment = JSON.stringify(assignments)

        const assignments = await r.knex('campaign_contact')
          .where('assignment_id', assignmentId)

        await r.redis.lpush(texterAssignmentKey, texterAssignment)
      }
    }
  }
}
