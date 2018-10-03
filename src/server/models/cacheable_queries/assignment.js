import { r, loaders } from '../../models'
import campaignCache from './campaign'
import { loadAssignmentContacts, getContacts, optOutContact } from './assignment-contacts'

// TODO: add user-org-assignment list for user.todos
// TODO: move user metadata (first/last) into a separate cache key to avoid cache drift
// ## KEY
// assignment-<assignmentId>
//   - user_id
//   - campaign_id
//   - organization_id (extra)
//   - texter{}: user (do not save, so will update with texter info)
//   - max_contacts
//   - campaign{} (lookup with campaignCache)

// ## SORTED SET (sadly a bit complex: all functions in ./assignment-contacts.js)
// assignmentcontacts-<assignmentId>-<tz>
//   key=<contactId>
//   score=<mix of message_status AND message newness (Think `ORDER BY message_status, created_at DESC`)>
//            optedOut: score=0
//      e.g.  needsMessage is between 1-9999999
//            needsResponse is between 10000000-19999999
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

const saveCache = async (assignment, campaign) => {
  if (r.redis) {
    const id = assignment.id
    // eslint-disable-next-line no-param-reassign
    assignment.organization_id = campaign.organization_id
    await r.redis.multi()
      .set(assignmentHashKey(id), JSON.stringify(assignment))
      .expire(assignmentHashKey(id), 86400)
      .execAsync()
    await loadAssignmentContacts(id,
                                 campaign.organization_id,
                                 campaign.contactTimezones)
  }
}

const loadDeep = async (id) => {
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
    await saveCache(assignment, campaign)
  }
  loaders.assignment.clear(id)
  return { assignment }
}

const loadCampaignAssignments = async (campaign) => {
  if (r.redis) {
    const assignments = await assignmentQuery()
      .where('campaign_id', campaign.id)
    for (let i = 0, l = assignments.length; i < l; i++) {
      await saveCache(assignments[i], campaign)
    }
  }
}

const assignmentCache = {
  clear: async (id) => {
    if (r.redis) {
      await r.redis.delAsync(assignmentHashKey(id))
    }
    loaders.assignment.clear(id)
  },
  clearAll: async (ids) => {
    if (r.redis && ids && ids.length) {
      const keys = ids.map(id => assignmentHashKey(id))
      await r.redis.delAsync(...keys)
    }
    loaders.assignment.clearAll()
  },
  reload: loadDeep,
  load: async (id) => {
    if (r.redis) {
      const assnData = await r.redis.getAsync(assignmentHashKey(id))
      if (assnData) {
        const assnObj = JSON.parse(assnData)
        return assnObj
      }
    }
    const { assignment } = await loadDeep(id)
    return assignment
  },
  hasAssignment,
  getContacts,
  optOutContact,
  loadCampaignAssignments
}

export default assignmentCache
