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
    const assignments = await r.knex('assignment')
      .select('id', 'user_id', 'max_contacts')
      .where('campaign_id', campaignId)
      .then((result) => {
        return result
      })

    const availableAssignments = await r.knex('campaign_contact')
      .select()
      .where({
        'campaign_id': campaignId,
        'is_opted_out': false,
        'message_status': 'needsMessage'
      })
      .then((contacts) => {
        const newArr = []
        contacts.forEach((contact) => {
          newArr.push(`id:${contact.id}-assignment_id:${contact.assignment_id}-external_id:${contact.external_id}-first_name:${contact.first_name}-last_name:${contact.last_name}-cell${contact.cell}-zip:${contact.zip}-timezone_offset:${contact.timezone_offset}
          `)
        })
        return newArr
      })


    if (dynamicAssignment && !!assignments) {
      for (let i = 0; i < assignments.length; i++) {
        // value is the actual assignments available for this campaign
        const texterId = assignments[i].user_id
        const maxContacts = assignments[i].max_contacts
        const dynamicAssignmentKey = `dynamicassignments-${texterId}-${campaignId}`
        const possibleAssignmentsForTexterValue = `max_contacts-${maxContacts}-campaign_contacts-${availableAssignments}`

        await r.redis.lpush(dynamicAssignmentKey, possibleAssignmentsForTexterValue)
      }
    }

    if (!dynamicAssignment && !!assignments){

      for (let i = 0; i < assignments.length; i++) {
        // value is the actual assignment for a specific texter
        const texterId = assignments[i].user_id
        const assignmentId = assignments[i].id
        const texterAssignmentKey = `newassignments-${texterId}-${campaignId}`
        const texterContacts = await r.knex('campaign_contact')
          .where('assignment_id', assignmentId)
          .then((contacts) => {
            const newArr = []
            contacts.forEach((contact) => {
              newArr.push(`id:${contact.id}-assignment_id:${contact.assignment_id}-external_id:${contact.external_id}-first_name:${contact.first_name}-last_name:${contact.last_name}-cell${contact.cell}-zip:${contact.zip}-timezone_offset:${contact.timezone_offset}
              `)
            })
            return newArr
          })

        const texterAssignmentValue = `campaign_contacts-${texterContacts}`
        await r.redis.lpush(texterAssignmentKey, texterAssignmentValue)
      }
    }
  }
}
