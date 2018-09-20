import { getOffsets, defaultTimezoneIsBetweenTextingHours } from '../../../lib'
import { r } from '../index'

// This is a library for ./assignment.js consolidating all functions related to caching/querying assignment-contacts

const assignmentContactsKey = (id, tz) => `${process.env.CACHE_PREFIX || ''}assignmentcontacts-${id}-${tz}`

// TODO: dynamic assignment (updating assignment-contacts with dynamically assigned contacts)
// TODO: updating message status
// TODO: expiration

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
  'closed': [40000000, 49999999]
}

const filterMessageStatuses = (messageStatusFilter) => {
  if (messageStatusFilter) {
    return (messageStatusFilter === 'needsMessageOrResponse'
            ? ['needsMessage', 'needsResponse']
            : messageStatusFilter.split(','))
  }
}

export const getContacts = async (assignment, contactsFilter, organization, campaign, forCount, justCount, justIds) => {
  const contactQueryArgs = getContactQueryArgs(assignment.id, contactsFilter, organization, campaign, forCount, justCount, justIds)
  if (typeof contactQueryArgs.result !== 'undefined') {
    return contactQueryArgs.result
  }
  const cachedResult = await cachedContactsQuery(contactQueryArgs)
  //console.log('getContacts cached', justCount, justIds, assignment.id, cachedResult)
  return (cachedResult !== null
          ? cachedResult
          : dbContactsQuery(contactQueryArgs))
}

export const dbGetContactsQuery = (assignment, contactsFilter, organization, campaign, forCount, justCount, justIds) => {
  const contactQueryArgs = getContactQueryArgs(assignment.id, contactsFilter, organization, campaign, forCount, justCount, justIds)
  return (typeof contactQueryArgs.result !== 'undefined'
          ? contactQueryArgs.result
          : dbContactsQuery(contactQueryArgs))
}

export const optOutContact = async (assignmentId, contactId, campaign) => {
  if (r.redis && campaign.contactTimezones) {
    for (let i = 0, l = campaign.contactTimezones.length; i < l; i++) {
      const tz = campaign.contactTimezones[i]
      // XX only changes the score if it already exists
      await r.redis.zaddAsync(assignmentContactsKey(assignmentId, tz), 'XX', 0, contactId)
    }
  }
}

export const getContactQueryArgs = (assignmentId, contactsFilter, organization, campaign, forCount, justCount, justIds) => {
  // / returns list of contacts eligible for contacting _now_ by a particular user
  const includePastDue = (contactsFilter && contactsFilter.includePastDue)
  // 24-hours past due - why is this 24 hours offset?
  const pastDue = (campaign.due_by
                   && Number(campaign.due_by) + 24 * 60 * 60 * 1000 < Number(new Date()))
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

  if (!includePastDue && pastDue && contactsFilter.messageStatus === 'needsMessage') {
    return { result: (justCount ? 0 : []) }
  }

  let timezoneOffsets = null
  let messageStatuses = null
  if (contactsFilter) {
    const validTimezone = contactsFilter.validTimezone
    if (typeof validTimezone === 'boolean') {
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

      if (finalQueryOffsets.length === 0) {
        return { result: (justCount ? 0 : []) }
      }
      timezoneOffsets = finalQueryOffsets
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
    timezoneOffsets,
    messageStatuses,
    forCount,
    justCount,
    justIds,
    isOptedOutFilter: contactsFilter && contactsFilter.isOptedOut
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
  } else {
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
    return query
  }
}

export const cachedContactsQuery = async ({ assignmentId, timezoneOffsets, messageStatuses, isOptedOutFilter, justCount, justIds }) => {
  if (r.redis
      // Below are restrictions on what we support from the cache.
      // Narrowing it to these cases (which are actually used, and others aren't)
      // we can simplify the logic by not accomodating all the different permutations
      && timezoneOffsets
      && (justCount || justIds)) {
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
        }, 'xxx')
        if (!range) {
          return null // non-adjacent ranges bail
        }
      }
    }
    const cmd = (justCount ? 'zcount' : 'zrangebyscore')
    let resultQuery = r.redis.multi()
    let existsQuery = r.redis.multi()
    timezoneOffsets.forEach((tz) => {
      const key = assignmentContactsKey(assignmentId, tz)
      existsQuery = existsQuery.exists(key)
      resultQuery = resultQuery[cmd](key, range[0], range[1])
    })
    //console.log('redis assignment query', assignmentId, timezoneOffsets, range)
    const existsResult = await existsQuery.execAsync()
    if (existsResult.reduce((a, b) => a && b, true)) {
      const redisResult = await resultQuery.execAsync()
      if (justCount) {
        return redisResult.reduce((i, j) => i + j, 0)
      } else if (justIds) {
        return redisResult
          .reduce((m, n) => [...m, ...n], [])
          .map(id => ({ id }))
      }
    }
  }
  return null
}

const sharingOptOuts = !!process.env.OPTOUTS_SHARE_ALL_ORGS
export const loadAssignmentContacts = async (assignmentId, organizationId, timezoneOffsets) => {
  // * for each timezone
  //   * zadd <key> <needsMessageScore> cid ...
  // * if not needsMessage, then need to sort by recent message
  const cols = []
  const contacts = await r.knex('campaign_contact')
    .select('campaign_contact.id as cid',
            'campaign_contact.message_status as status',
            'campaign_contact.timezone_offset as tz_offset',
            'opt_out.id as optout',
            r.knex.raw('MAX(message.created_at) as latest_message'))
    .leftJoin('message', function () {
      return this.on('message.assignment_id', '=', 'campaign_contact.assignment_id')
        .andOn('message.contact_number', '=', 'campaign_contact.cell') })
    .leftJoin('opt_out', function () {
      let joinOn = this.on('opt_out.cell', '=', 'campaign_contact.cell')
      return (!sharingOptOuts
              ? joinOn
              : joinOn.andOn('opt_out.organization_id', '=',
                             r.knex.raw('?', [organizationId])))
    })
    .where('campaign_contact.assignment_id', assignmentId)
    .groupBy('campaign_contact.id',
             'campaign_contact.message_status',
             'campaign_contact.timezone_offset',
             'opt_out.id')
    .orderByRaw('campaign_contact.timezone_offset, campaign_contact.message_status DESC, MAX(message.created_at)')
  // 2. group results with scores
  const tzs = {}
  timezoneOffsets.forEach((tzOffset) => {
    tzs[tzOffset] = {
      contacts: [],
      needsMessage: 0, needsResponse: 0, convo: 0, messaged: 0, closed: 0
    }
  })
  const getScore = (c, tzObj) => {
    if (c.optout) {
      return 0
    }
    if (c.latest_message) {
      // note: needsMessage will never increment and always end up ===1
      ++(tzObj[c.status])
    }
    if (c.status === 'convo') {
      // starts at max and counts down for reverse order
      return msgStatusRange[c.status][1] - tzObj[c.status]
    }
    return msgStatusRange[c.status][0] + tzObj[c.status]
  }
  contacts.forEach((c) => {
    const tzObj = tzs[c.tz_offset]
    tz.contacts.push(getScore(c, tzObj), c.cid)
  })
  for (const tz in tzs) {
    const contacts = tzs[tz].contacts
    const key = assignmentContactsKey(assignmentId, tz)
    await r.redis.multi()
      .del(key)
    // TODO: is there a max to how many we can add at once?
      .zadd(key, ...contacts)
      .execAsync()
  }
}

export const updateAssignmentContact = async (contact, newStatus) => {
  // Needs: contact.id, contact.timezone_offset, contact.assignment_id, ?contact.message_status
  const key = assignmentContactsKey(contact.assignment_id, contact.timezone_offset)
  const range = msgStatusRange[newStatus]
  const cmd = (newStatus === 'convo' ? 'zrangebyscore' : 'zrevrangebyscore')
  const [exists, curMax] = await r.redis.multi()
    .exists(key)
    [cmd](key, range[0], range[1], 'WITHSCORES', 'LIMIT', 0, 1)
    .execAsync()
  //console.log('updateassignmentcontact', contact.id, newStatus, range, cmd, key, exists, curMax)
  if (exists) {
    const newScore = (curMax && curMax.length
                      ? curMax[0] + (newStatus === 'convo' ? -1 : 1)
                      : (newStatus === 'convo' ? range[1] : range[0]))
    //console.log('updateassignment', newScore, await r.redis.zrangeAsync(key, 0, -1, 'WITHSCORES'))
    await r.redis.zaddAsync([key, newScore, contact.id])
  }
}
