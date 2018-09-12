import { r, Assignment } from '../../models'
import { campaignCache } from './campaign'

// ## HASH
// assignment-<assignmentId>
//   - user_id
//   - campaign_id
//   - organization_id (extra)
//   - texter{}: user (do not save, so will update with texter info)
//   - max_contacts
//   OTHER DATA
//    - campaign{}
//    - contacts: [LIST] (TexterTodo.jsx)
//        $contactsFilter
//        "messageStatus", isOptedOut:false, validTimezone:true
//    - contactsCount (TexterTodoList.jsx)
//      - needsMessage: isOptedOut:false, validTimezone:true
//      - needsResponse: isOptedOut:false, validTimezone:true
//      - badTimezone: isOptedOut:false, validTimezone:false
//      - completedConvos: isOptedOut:false, validTimezone:true, messageStatus:messaged
//      - pastMessageFilter: isOptedOut:false, validTimezone:true, messageStatus:convo
//      - skippedMessageFilter: isOptedOut:false, validTimezone:true, messageStatus:closed

const assignmentHashKey = (id) => `${process.env.CACHE_PREFIX|""}assignment-${id}`
const assignmentContactsKey = (id) => `${process.env.CACHE_PREFIX|""}assignmentcontacts-${id}`

const hasAssignment = async (userId, assignmentId) => {
  if (r.redis) {
    const assnData = await r.redis.getAsync(assignmentHashKey(assignmentId))
    if (assnData) {
      const assnObj = JSON.parse(assnData)
      return (assnObj.userId === userId)
    }
  }
  const [assignment] = await r.knex('assignment')
    .where({
      user_id: userId,
      id: assignmentId
    }).limit(1)
  return Boolean(assignment)
}

const msgStatusRange = {
  // Inclusive min/max ranges
  // Special ranges:
  // - isOptedOut: 1000
  'needsMessage': [0, 0],
  'needsResponse': [1, 1],
  'needsMessageOrResponse': [0, 1],
  'convo': [2, 2],
  'messaged': [3, 3],
  'closed': [4, 4],
}

const getContacts = async (assignmentId, contactsFilter, { justIds, justCount, campaign, organization }) => {
  if (r.redis
      // Below are restrictions on what we support from the cache.
      // Narrowing it to these cases (which are actually used, and others aren't)
      // we can simplify the logic by not accomodating all the different permutations
      && (!contactsFilter
          || (contactsFilter.isOptedOut === false
              && typeof contactsFilter.validTimezone !== 'undefined'
              && contactsFilter.validTimezone !== null))
      && (justCount || justIds)) {
    // if it doesn't exist, then maybe the assignment was deleted, and we can't assume 0 means uncached
    const exists = await r.redis.existsAsync(assignmentContactsKey(assignmentId))
    if (exists) {
      // TODO validTimezone AND timezones!
      let range = [0, 1000] // everything, including optouts
      if (contactsFilter && contactsFilter.isOptedOut === false) {
        if (!contactsFilter.messageStatus) {
          range = [0, 99]
        } else { // contactsFilter.messageStatus
          range = msgStatusRange[contactsFilter.messageStatus]
        }
      }
      const cmd = (justCount ? 'zcountAsync' : 'zrangebyscoreAsync')
      const cacheResult = await r.redis[cmd](assignmentContactsKey(assignmentId), range[0], range[1])
      if (cacheResult !== null) {
        return cacheResult
      }
    } // end:exists
  } // end:r.redis
  return dbGetContacts()
}

const loadDeep = async (id, yesDeep) => {
  const [assignment] = await r.knex('assignment')
    .select('id', 'user_id', 'campaign_id', 'max_contacts')
    .where('id', id)
    .limit(1)

  if (r.redis && assignment) {
    const campaign = campaignCache.load(assignment.campaign_id)
    assignment.organization_id = campaign.organization_id
    await r.redis.multi()
      .set(assignmentHashKey(id), JSON.stringify(assignment))
      .expire(assignmentHashKey(id), 86400)
      .execAsync()
  }
  return { assignment }
}

export const assignmentCache = {
  clear: async (id) => {
    if (r.redis) {
      await r.redis.delAsync(assignmentHashKey(id), assignmentContactsKey(id))
    }
  },
  reload: loadDeep,
  load: async (id) => {
    if (r.redis) {
      const assnData = await r.redis.getAsync(assignmentHashKey(assignmentId))
      if (assnData) {
        const assnObj = JSON.parse(assnData)
        return assnObj
      }
    }
    const { assignment } = loadDeep(id)
    return assignment
    // should load cache of campaign by id separately, so that can be updated on campaign-save
    // e.g. for script changes
    // should include:
    // texter: id, firstName, lastName, assignedCell, ?userCannedResponses
    // campaignId
    // organizationId
    // ?should contact ids be key'd off of campaign or assignment?
  },
  hasAssignment: hasAssignment,
  optOutContact: async (assignmentId, contactId) => {
    if (r.redis) {
      // TODO: will need to iterate over timezones
      await r.redis.zaddAsync(assignmentContactsKey(assignmentId), 'XX', 1000, contactId)
    }
  }
}
