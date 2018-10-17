import { getOffsets, defaultTimezoneIsBetweenTextingHours } from '../../../lib'
import { r } from '../index'

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

const assignmentContactsKey = (assignmentId, tz) => `${process.env.CACHE_PREFIX || ''}assignmentcontacts-${assignmentId}-${tz}`

const msgStatusRange = {
  // Inclusive min/max ranges
  // Special ranges:
  // - isOptedOut: 0
  // These ranges provide 10 million messages as 'room'
  // this is per-assignment, so should be plenty.
  // Redis uses a 64-bit floating point, so we can bump it up if necessary :-P
  needsMessage: [1, 9999999],
  needsResponse: [10000000, 19999999],
  needsMessageOrResponse: [1, 19999999],
  convo: [20000000, 29999999],
  messaged: [30000000, 39999999],
  closed: [40000000, 49999999]
}

const filterMessageStatuses = (messageStatusFilter) => (
  messageStatusFilter
  && (messageStatusFilter === 'needsMessageOrResponse'
      ? ['needsMessage', 'needsResponse']
      : messageStatusFilter.split(','))
)

export const getTimezoneOffsets = (organization, campaign, validTimezone) => {
  const config = {
    textingHoursStart: organization.texting_hours_start,
    textingHoursEnd: organization.texting_hours_end,
    textingHoursEnforced: organization.texting_hours_enforced
  }

  if (campaign.override_organization_texting_hours) {
    config.campaignTextingHours = {
      textingHoursStart: campaign.texting_hours_start,
      textingHoursEnd: campaign.texting_hours_end,
      textingHoursEnforced: campaign.texting_hours_enforced,
      timezone: campaign.timezone }
  }

  const [validOffsets, invalidOffsets] = getOffsets(config)
  const [queryOffsets, addMissingTz] = (validTimezone
                                        ? [validOffsets, x => x]
                                        : [invalidOffsets, x => !x])
  if (addMissingTz(defaultTimezoneIsBetweenTextingHours(config))) {
    queryOffsets.push('')
  }

  let finalQueryOffsets = queryOffsets
  if (campaign.contactTimezones) {
    finalQueryOffsets = queryOffsets.filter(offset => campaign.contactTimezones.indexOf(offset) !== -1)
  }
  return finalQueryOffsets
}

const getTimeOfDayScore = (range) => {
  const time = new Date()
  // Note, this is pretty close to the range but if we did full milliseconds, we'd go over
  const dayScore = Math.floor((time.getUTCHours() * 60 * 24 * 100)
                              + (time.getUTCMinutes() * 60 * 100)
                              + time.getUTCSeconds() * 100
                              + time.getMilliseconds() / 10
                             )
  return Math.floor(range[0] + dayScore)
}

const dayCycleSortFunction = (messageStatus, key) => {
  // return a function that will sort based on current time and the inputted range
  // for 'most recent', though if it's 7pm today and someone texted at 6:30pm *yesterday*
  // then it will be as if that person texted at 6:30pm today -- i.e. we flatten the day
  const range = msgStatusRange[messageStatus]
  const now = getTimeOfDayScore(range) + 1000 // add 1000 to avoid millisecond/delta games
  const max = range[1]
  return (a, b) => {
    // Price is Right rules
    // Sort so that it is ordered with low being most recent (closest to now but under)
    // and the stuff after now is from yesterday, and so should sort in reverse order
    const aval = (a[key] > now ? max + now - a[key] : now - a[key])
    const bval = (b[key] > now ? max + now - b[key] : now - b[key])
    if (messageStatus === 'convo') {
      return aval - bval // newest to oldest
    }
    return bval - aval // oldest to newest
  }
}

export const getContactQueryArgs = (assignmentId, contactsFilter, organization, campaign, forCount, justCount, justIds) => {
  // / returns list of contacts eligible for contacting _now_ by a particular user
  const includePastDue = (contactsFilter && contactsFilter.includePastDue)
  // 24-hours past due - why is this 24 hours offset?
  const pastDue = (campaign.due_by
                   && Number(campaign.due_by) + 24 * 60 * 60 * 1000 < Number(new Date()))

  if (!includePastDue && pastDue && contactsFilter && contactsFilter.messageStatus === 'needsMessage') {
    return { result: (justCount ? 0 : []) }
  }

  let timezoneOffsets = null
  let messageStatuses = null
  if (contactsFilter) {
    const validTimezone = contactsFilter.validTimezone
    if (typeof validTimezone === 'boolean') {
      timezoneOffsets = getTimezoneOffsets(organization, campaign, validTimezone)

      if (timezoneOffsets.length === 0) {
        return { result: (justCount ? 0 : []) }
      }
    }

    messageStatuses = filterMessageStatuses(
      contactsFilter.messageStatus ||
        (pastDue
         // by default if asking for 'send later' contacts we include only those that need replies
         ? 'needsResponse'
         // we do not want to return closed/messaged
         : 'needsMessageOrResponse'))
  }
  return {
    assignmentId,
    campaign,
    timezoneOffsets,
    messageStatuses,
    forCount,
    justCount,
    justIds,
    isOptedOutFilter: contactsFilter && contactsFilter.isOptedOut
  }
}

export const cachedContactsQuery = async ({ assignmentId, timezoneOffsets, messageStatuses, isOptedOutFilter, justCount, justIds, campaign }) => {
  if (r.redis
      // Below are restrictions on what we support from the cache.
      // Narrowing it to these cases (which are actually used, and others aren't)
      // we can simplify the logic by not accomodating all the different permutations
      // FUTURE: we will need to debug the issue below of texters not being saved properly after a cache flush
      && (timezoneOffsets) // || (campaign && campaign.contactTimezones))
      && (justCount || (justIds && messageStatuses))) {
    let range = [0, Infinity] // everything, including optouts
    if (isOptedOutFilter === true) {
      range = [0, 0]
    } else {
      // isOptedOutFilter either false or null
      // means we can test for message statuses or leave as-is
      if (!messageStatuses) {
        range = [1, Infinity] // exclude optouts
      } else { // contactsFilter.messageStatus
        range = messageStatuses.reduce((accumulator, cur) => {
          if (!accumulator) {
            return null
          }
          const curRange = msgStatusRange[cur]
          if (accumulator === 'xxx') {
            return curRange
          }
          if (curRange[0] === accumulator[1] + 1) {
            // we only support adjacent ranges for cache solution
            return [accumulator[0], curRange[1]]
          }
          return null
        }, 'xxx')
        if (!range) {
          return null // non-adjacent ranges bail
        }
      }
    }
    const cmd = (justCount ? 'zcount' : 'zrangebyscore')
    let resultQuery = r.redis.multi()
    let existsQuery = r.redis.multi()
    timezoneOffsets = timezoneOffsets || campaign.contactTimezones
    timezoneOffsets.forEach((tz) => {
      const key = assignmentContactsKey(assignmentId, tz)
      // console.log('assignentcontacts key', key)
      existsQuery = existsQuery.exists(key)
      resultQuery = resultQuery[cmd](key, range[0], range[1], justCount ? undefined : 'WITHSCORES')
    })
    // console.log('redis assignment query', assignmentId, timezoneOffsets, range)
    const existsResult = await existsQuery.execAsync()
    if (existsResult.reduce((a, b) => a && b, true)) {
      const redisResult = await resultQuery.execAsync()
      if (justCount) {
        return redisResult.reduce((i, j) => Number(i) + Number(j), 0)
      } else if (justIds) {
        // console.log('redis assignment contact result', assignmentId, timezoneOffsets, range, messageStatuses)
        const retVal = []
        redisResult.forEach(tzScoreList => {
          for (let i = 0, l = tzScoreList.length; i < l; i = i + 2) {
            retVal.push({ id: tzScoreList[i], score: Number(tzScoreList[i + 1]) })
          }
        })
        // Sort so we can combine the diff timezone cache lines together
        // This function also reverses when status=convo
        retVal.sort(dayCycleSortFunction(messageStatuses[0], 'score'))
        return retVal
      }
    }
  }
  return null
}

export const optOutContact = async (assignmentId, contactId, contactTimezones) => {
  if (r.redis && contactTimezones && contactTimezones.length) {
    for (let i = 0, l = contactTimezones.length; i < l; i++) {
      const tz = contactTimezones[i]
      // console.log('optoutcontact', assignmentId, contactId, tz)
      const key = assignmentContactsKey(assignmentId, tz)
      const exists = await r.redis.zscoreAsync(key, contactId)
      if (exists) {
        await r.redis.zadd(key, 0, contactId)
      }
    }
  }
}

export const dbContactsQuery = ({ assignmentId, timezoneOffsets, messageStatuses, isOptedOutFilter, forCount, justCount, justIds }) => {
  let query = r.knex('campaign_contact').where('assignment_id', assignmentId)
  if (timezoneOffsets) {
    query = query.whereIn('timezone_offset', timezoneOffsets)
  }
  if (messageStatuses) {
    query = query.whereIn('message_status', messageStatuses)
  }
  if (typeof isOptedOutFilter === 'boolean') {
    query = query.where('is_opted_out', isOptedOutFilter)
  }
  if (forCount) {
    return query
  } else if (justCount) {
    return r.getCount(query)
  }

  if (messageStatuses
      && messageStatuses.length === 1
      && messageStatuses[0] === 'convo') {
    query = query.orderByRaw('message_status DESC, updated_at DESC')
  } else {
    query = query.orderByRaw('message_status DESC, updated_at')
  }
  if (justIds) {
    query = query.select('id')
  }
  // console.log('dbContactsQuery', query.toString())
  return query
}

export const dbGetContactsQuery = (assignment, contactsFilter, organization, campaign, forCount, justCount, justIds) => {
  const contactQueryArgs = getContactQueryArgs(assignment.id, contactsFilter, organization, campaign, forCount, justCount, justIds)
  return (typeof contactQueryArgs.result !== 'undefined'
          ? contactQueryArgs.result
          : dbContactsQuery(contactQueryArgs))
}

const sharingOptOuts = !!process.env.OPTOUTS_SHARE_ALL_ORGS

export const loadAssignmentContacts = async (assignmentId, campaignId, organizationId, timezoneOffsets) => {
  // * for each timezone
  //   * zadd <key> <needsMessageScore> cid ...
  // * if not needsMessage, then need to sort by recent message
  // console.log('loadAssignmentContacts', assignmentId, campaignId, organizationId, timezoneOffsets)
  if (r.redis && timezoneOffsets && timezoneOffsets.length) {
    const contacts = await r.knex('campaign_contact')
      .select('campaign_contact.id as cid',
              'campaign_contact.message_status as message_status',
              'campaign_contact.timezone_offset as tz_offset',
              'opt_out.id as optout',
              r.knex.raw('MAX(message.created_at) as latest_message'))
      .leftJoin('message', function msgJoin() {
        // TODO: change to campaign_contact_id, maybe?
        return this.on('message.assignment_id', '=', 'campaign_contact.assignment_id')
          .andOn('message.contact_number', '=', 'campaign_contact.cell') })
      .leftJoin('opt_out', function optoutJoin() {
        const joinOn = this.on('opt_out.cell', '=', 'campaign_contact.cell')
        return (!sharingOptOuts
                ? joinOn
                : joinOn.andOn('opt_out.organization_id', '=',
                               r.knex.raw('?', [organizationId])))
      })
      .where({ 'campaign_contact.assignment_id': assignmentId,
               'campaign_contact.campaign_id': campaignId // redundant guard
             })
      .groupBy('campaign_contact.id',
               'campaign_contact.message_status',
               'campaign_contact.timezone_offset',
               'opt_out.id')
      .orderByRaw('campaign_contact.timezone_offset, campaign_contact.message_status DESC, MAX(message.created_at)')
    // 2. group results with scores
    const tzContacts = {}
    const statusCounters = {
      needsMessage: 0, needsResponse: 0, convo: 0, messaged: 0, closed: 0
    }
    timezoneOffsets.forEach((tzOffset) => {
      tzContacts[tzOffset] = []
    })
    // console.log('loadAssignmentContacts data', tzs)
    const getScore = (c) => {
      if (c.optout) {
        return 0
      }
      // eslint-disable-next-line no-param-reassign
      statusCounters[c.message_status] += 1

      // if (c.status === 'convo') {
      //   // starts at max and counts down for reverse order
      //   return msgStatusRange[c.status][1] - tzObj[c.status]
      // }
      return msgStatusRange[c.message_status][0] + statusCounters[c.message_status]
    }
    contacts.forEach((c) => {
      tzContacts[c.tz_offset].push(getScore(c), c.cid)
    })
    const tzKeys = Object.keys(tzContacts)
    for (let i = 0, l = tzKeys.length; i < l; i++) {
      const tz = tzKeys[i]
      const contactsTz = tzContacts[tz]
      const key = assignmentContactsKey(assignmentId, tz)
      // console.log('loadAssignmentContacts', tz, key, tzContacts)
      if (contactsTz.length === 0) {
        // for the sorted set to exist, we need something in there
        contactsTz.push(-1, 'fakekey')
      }
      await r.redis.multi()
        .del(key)
         // this can be big, but redis supports 512M keys, so..
        .zadd(key, ...contactsTz)
        .expire(key, 43200)
        .execAsync()
    }
  }
}

export const getContacts = async (assignment, contactsFilter, organization, campaign, forCount, justCount, justIds) => {
  const contactQueryArgs = getContactQueryArgs(assignment.id, contactsFilter, organization, campaign, forCount, justCount, justIds)
  if (typeof contactQueryArgs.result !== 'undefined') {
    return contactQueryArgs.result
  }
  const cachedResult = await cachedContactsQuery(contactQueryArgs)
  if (justIds) {
    // console.log('getContacts cached', justCount, justIds, assignment.id, contactsFilter, cachedResult && cachedResult.length, cachedResult && cachedResult.slice(0, 2))
  }
  if (justIds && cachedResult === null && campaign.contactTimezones) {
    // Trigger a cache load if we're loading ids, which is only done for the texter
    // async (no await) on purpose to avoid blocking the original request
    loadAssignmentContacts(assignment.id, campaign.id, organization.id, campaign.contactTimezones)
      .then(() => 1)
  }
  return (cachedResult !== null
          ? cachedResult
          : dbContactsQuery(contactQueryArgs))
}

export const getTotalContactCount = async (assignment, campaign) => (
  getContacts(assignment, null, { texting_hours_enforced: false }, campaign, false, true, false)
)

export const clearAssignmentContacts = async (assignmentId, timezoneOffsets, contact) => {
  if (r.redis && assignmentId && timezoneOffsets && timezoneOffsets.length) {
    if (contact) {
      await r.redis.zremAsync(assignmentContactsKey(assignmentId, contact.timezone_offset),
                              contact.id)
    } else {
      const keys = timezoneOffsets.map(tz => assignmentContactsKey(assignmentId, tz))
      await r.redis.delAsync(...keys)
    }
  }
}

export const updateAssignmentContact = async (contact, newStatus, delta) => {
  // Needs: contact.id, contact.timezone_offset, contact.assignment_id
  if (r.redis) {
    const key = assignmentContactsKey(contact.assignment_id, contact.timezone_offset)
    const range = msgStatusRange[newStatus]
    const exists = await r.redis.existsAsync(key)
    if (exists) {
      const newScore = getTimeOfDayScore(range, newStatus) + (delta || 0)
      // console.log('updateassignment', contact.id, newScore, newStatus, range)
      await r.redis.multi()
        .zadd([key, newScore, contact.id])
        .expire(key, 43200)
        .execAsync()
    }
  }
}
