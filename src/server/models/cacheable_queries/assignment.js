import { r, Assignment } from '../../models'
import { campaignCache } from './campaign'

// ## KEY
// assignment-<assignmentId>
//   - user_id
//   - campaign_id
//   - organization_id (extra)
//   - texter{}: user (do not save, so will update with texter info)
//   - max_contacts
//   - campaign{} (lookup with campaignCache)

// ## SORTED SET (sadly a bit complex)
// assignmentcontacts-<assignmentId>-<tz>
//   key=<contactId>
//   score=<mix of message_status AND message newness>
//            optedOut: score=0
//      e.g.  needsMessage is between 1-999 (add 4 more nines for scaled reality)
//            needsResponse is between 1000-1999
//            convo, messaged, closed all other ranges
//      When a conversation is updated we will update the score as
//        one more than the current highest
//   Requirements:
//    * filter based on message_status
//    * filter based on *current* time in contact timezone being valid/invalid
//    * easy counting of the same
//   Strategy:
//    ZRANGEBYSCORE: Since message_status is grouped together we can get ids with min/max
//    ZCOUNT: We can count within a min/max range as well
//    ZREVRANGEBYSCORE: With 'LIMIT 1' can get the highest current val within a range
//                      We then update a message with that +1 each conversation change
//    <tz> aggregating:
//      Since which timezones are valid/invalid changes, this adds another dimension
//      to an already crowded datastructure
//      Thus we split out contacts by timezone and so each contact query will need
//      to go across the relevant timezones, and then aggregate the results.
//      * There's a subtle issue that newest messages across multiple timezones
//        will be grouped
//      * To avoid querying too many empty timezones, we cache all the
//        campaign_contact.timezone_offset ranges for a particular campaign on the
//        campaign cache object (campaign.contactTimezones) -- that way we can
//        only search timezones that are actually possible
//   Client Queries:
//    TexterTodo.jsx
//    - contacts: [LIST of ids] (
//       $contactsFilter
//       "<messageStatus>", isOptedOut:false, validTimezone:true
//    - contactsCount (no filter)
//    TexterTodoList.jsx
//    - contactsCount (
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
  // - isOptedOut: 0
  // These ranges provide 10 million messages as 'room'
  // this is per-assignment, so should be plenty.
  // Redis uses a 64-bit floating point, so we can bump it up if necessary :-P
  'needsMessage': [1, 9999999],
  'needsResponse': [10000000, 19999999],
  'needsMessageOrResponse': [1, 19999999],
  'convo': [20000000, 29999999],
  'messaged': [30000000, 39999999],
  'closed': [40000000, 49999999],
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
