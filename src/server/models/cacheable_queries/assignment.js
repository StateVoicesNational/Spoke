import { log } from '../../../lib'
import { r, loaders } from '../../models'
import campaignCache from './campaign'
import { loadAssignmentContacts,
         clearAssignmentContacts,
         getContacts,
         getTotalContactCount,
         optOutContact } from './assignment-contacts'
import { getUserAssignments, clearUserAssignments, addUserAssignment } from './assignment-user'
import { findNewContacts, findStaleInflights, reloadCampaignContactsForDynamicAssignment } from './assignment-dynamic'

// ## KEY
// assignment-<assignmentId>
//   - user_id
//   - campaign_id
//   - organization_id (extra)
//   - texter{}: user (do not save, so will update with texter info)
//   - max_contacts
//   - campaign{} (lookup with campaignCache)

const assignmentHashKey = (id) => `${process.env.CACHE_PREFIX || ''}assignment-${id}`

const hasAssignment = async (userId, assignmentId) => {
  if (r.redis) {
    const assnData = await r.redis.getAsync(assignmentHashKey(assignmentId))
    if (assnData) {
      const assnObj = JSON.parse(assnData)
      return (assnObj.user_id === userId)
    }
  }
  const [assignment] = await r.knex('assignment')
    .where({
      user_id: userId,
      id: assignmentId
    }).limit(1)
  return Boolean(assignment)
}

const assignmentQuery = () => (
  r.knex('assignment')
    .select('assignment.id as id',
            'assignment.user_id',
            'assignment.campaign_id',
            'assignment.max_contacts',
            'user.first_name',
            'user.last_name')
    .join('user', 'assignment.user_id', 'user.id'))

const saveCache = async (assignment, campaign, notDeep) => {
  if (r.redis) {
    const id = assignment.id
    // eslint-disable-next-line no-param-reassign
    assignment.organization_id = campaign.organization_id
    await r.redis.multi()
      .set(assignmentHashKey(id), JSON.stringify(assignment))
      .expire(assignmentHashKey(id), 43200)
      .execAsync()

    await addUserAssignment(campaign, assignment)
    if (!notDeep && campaign.contactTimezones) {
      await loadAssignmentContacts(id,
                                   campaign.id,
                                   campaign.organization_id,
                                   campaign.contactTimezones)
    }
  }
}

const loadDeep = async (id, notDeep) => {
  // needs refresh whenever
  // * assignment is updated
  // * user is updated
  // * contacts are updated
  const [assignment] = await assignmentQuery()
    .where('assignment.id', id)
    .limit(1)
  // console.log('loaddeep assingment', assignment)
  if (r.redis && assignment) {
    const campaign = await campaignCache.load(assignment.campaign_id)
    // console.log('cached campaign for assn', campaign)
    await saveCache(assignment, campaign, notDeep)
    assignment.campaign = campaign
  }
  loaders.assignment.clear(String(id))
  loaders.assignment.clear(Number(id))
  return { assignment }
}

const loadCampaignAssignments = async (campaign) => {
  if (r.redis) {
    // console.log('loadCampaignAssignments', campaign.id)
    const assignments = await assignmentQuery()
      .where('campaign_id', campaign.id)
    for (let i = 0, l = assignments.length; i < l; i++) {
      await saveCache(assignments[i], campaign)
    }
  }
}

const load = async (assignmentId, notDeep) => {
  if (r.redis) {
    const assnData = await r.redis.getAsync(assignmentHashKey(assignmentId))
    if (assnData) {
      const assnObj = JSON.parse(assnData)
      return assnObj
    }
  }
  const { assignment } = await loadDeep(assignmentId, notDeep)
  return assignment
}

const clear = async (id, userId, campaign) => {
  if (r.redis) {
    await r.redis.delAsync(assignmentHashKey(id))
    if (campaign && userId) {
      // - With assignment.user_id: clear assignment-user
      await clearUserAssignments(campaign.organization_id, [userId], null, campaign.id)
    }
    if (campaign && campaign.contactTimezones) {
      // - With campaign.contactTimezones: clear assignment-contacts
      await clearAssignmentContacts(id, campaign.contactTimezones)
    }
  }
  loaders.assignment.clear(id)
}

const assignmentCache = {
  clear,
  deleteAll: async (assignments, campaign) => {
    if (assignments && assignments.length) {
      if (r.redis) {
        const keys = assignments.map(a => assignmentHashKey(a.id))
        await r.redis.delAsync(...keys)

        for (let i = 0, l = assignments.length; i < l; i++) {
          const a = assignments[i]
          await clearUserAssignments(campaign.organization_id,
                                     [a.user_id],
                                     a.id)
        }
      }
      // console.log('assignment.deleteAll', assignments)
      const assignmentIdsToDelete = assignments.map(a => a.id)
      try {
        await r.knex('assignment')
          .where('id', 'in', assignmentIdsToDelete)
          .delete()
      } catch (err) {
        log.error(`FAILED assignment delete, ${err}, ${assignmentIdsToDelete}`)
      }
    }
    loaders.assignment.clearAll()
  },
  reload: loadDeep,
  getUserTodos: async (organizationId, userId) => {
    console.log('getUserTodos', organizationId, userId)
    return await getUserAssignments(organizationId, userId, async (assignmentIds) => {
      console.log('getUserTodos assignmentIDS', organizationId, userId, assignmentIds)
      if (assignmentIds.length === 0) {
        return []
      }
      const assignments = []
      for (let i = 0, l = assignmentIds.length; i < l; i++) {
        const assignment = await load(assignmentIds[i], /* notDeep */ true)
        if (assignment) {
          // We could test for campaign.is_archived here,
          // but then we'd need to load it.  Instead we depend on
          // archiveCampaign (in api/schema.js) triggering clearUserAssignments
          assignments.push(assignment)
        } else {
          // assignment must have been deleted
          await clearUserAssignments(organizationId, [userId], assignmentIds[i])
        }
      }
      return assignments
    })
  },
  clearUserAssignments: async (organizationId, userId) => (
    await getUserAssignments(organizationId, userId, async (assignmentIds) => {
      for (let i = 0, l = assignmentIds.length; i < l; i++) {
        await clear(assignmentIds[i])
      }
    })
  ),
  userInflightCounts: async (campaignId) => {
    const textersWithInFlights = await findStaleInflights(campaignId)
    return textersWithInFlights.map(obj => ({ id: obj.userId,
                                              inflightCount: obj.contacts.length,
                                              inflightContacts: obj.contacts,
                                              lastMessageTime: obj.lastMessageTime }))
  },
  load,
  hasAssignment,
  findNewContacts,
  getContacts,
  clearAssignmentContacts,
  getTotalContactCount,
  optOutContact,
  loadCampaignAssignments,
  reloadCampaignContactsForDynamicAssignment
}

export default assignmentCache
