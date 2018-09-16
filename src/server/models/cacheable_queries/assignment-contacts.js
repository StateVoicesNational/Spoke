import { getOffsets, defaultTimezoneIsBetweenTextingHours } from '../../../lib'
import { r } from '../index'

const assignmentContactsKey = (id, tz) => `${process.env.CACHE_PREFIX||""}assignmentcontacts-${id}-${tz}`

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
  const cachedResult = cachedContactsQuery(contactQueryArgs)
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
    return {result: (justCount ? 0 : [])}
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
        return {result: (justCount ? 0 : [])}
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

export const dbContactsQuery = ({assignmentId, timezoneOffsets, messageStatuses, isOptedOutFilter, forCount, justCount, justIds}) => {
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

export const cachedContactsQuery = async ({assignmentId, timezoneOffsets, messageStatuses, isOptedOutFilter, justCount, justIds}) => {
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
          const accRange = (Array.isArray(accumulator)
                            ? accumulator
                            : msgStatusRange[accumulator])
          if (curRange[0] === accRange[1] + 1) {
            // we only support adjacent ranges for cache solution
            return [accRange[0], curRange[1]]
          }
        })
        if (!range) {
          return null // non-adjacent ranges bail
        }
      }
    }
    const cmd = (justCount ? 'zcount' : 'zrangebyscore')
    let resultQuery = r.redis.multi()
    let existsQuery = r.redis.multi()
    timezoneOffsets.forEach((tz) => {
      existsQuery = existsQuery[cmd](assignmentContactsKey(assignmentId, tz))
      resultQuery = resultQuery[cmd](assignmentContactsKey(assignmentId, tz), range[0], range[1])
    })
    const existsResult = await existsQuery.execAsync()
    if (existsResult.reduce((a,b) => a && b)) {
      const redisResult = await redisQuery.execAsync()
      return redisResult.reduce(
        justCount
          ? (i,j) => i + j
          : (m,n) => [...m, ...n])
    }
  }
  return null
}

export const loadAssignmentContacts = async (assignmentId, organizationId, timezoneOffsets) => {
  // * for each timezone
  //   * zadd <key> <needsMessageScore> cid ...
  // * if not needsMessage, then need to sort by recent message
  const cols = []
  console.log('loadAssignmentContacdts', assignmentId, organizationId, timezoneOffsets)
  const contacts = await r.knex('campaign_contact')
    .select('campaign_contact.id as cid',
            'campaign_contact.message_status as status',
            'campaign_contact.timezone_offset as tz_offset',
            'opt_out.id as optout',
            r.knex.raw('MAX(message.created_at) as latest_message'))
    .leftJoin('message', function () {
      return this.on('message.assignment_id', '=', 'campaign_contact.assignment_id')
        .andOn('message.contact_number', '=', 'campaign_contact.cell')})
    .leftJoin('opt_out', function () {
      return this.on('opt_out.cell', '=', 'campaign_contact.cell')
        .andOn('opt_out.organization_id', '=', r.knex.raw('?', [organizationId]))})
    .where('campaign_contact.assignment_id', assignmentId)
    .groupBy('campaign_contact.id',
             'campaign_contact.message_status',
             'campaign_contact.timezone_offset',
             'opt_out.id')
    .orderByRaw('campaign_contact.timezone_offset, campaign_contact.message_status DESC, MAX(message.created_at)')
  console.log('CONTACTS', contacts)
  // 2. group results with scores
  const tzs = {}
  timezoneOffsets.forEach((tzOffset) => {
    tzs[tzOffset] = {
      contacts: [],
      needsMessage: 0, needsResponse: 0, convo: 0, messaged: 0, closed: 0
    }
  })
  const getScore = (c, tz) => {
    if (c.optout) {
      return 0
    }
    if (c.latest_message) {
      // note: needsMessage will never increment and always end up ===1
      ++tz[c.status]
    }
    if (c.status === 'convo') {
      // starts at max and counts down for reverse order
      return msgStatusRange[c.status][1] - tz[c.status]
    }
    return msgStatusRange[c.status][0] + tz[c.status]
  }
  contacts.forEach((c) => {
    const tz = tzs[c.tz_offset]
    tz.contacts.push(getScore(c, tz), c.cid)
  })
  for (const timezone in tzs) {
    const contacts =  tzs[timezone].contacts
    console.log('TIMEZONE contacts', timezone, contacts)
    await r.redis.multi()
      .del(assignmentContactsKey(assignmentId, timezone))
      .zadd(assignmentContactsKey(assignmentId, timezone),
            // TODO: is there a max to how many we can add at once?
            ...contacts)
      .execAsync()
  }
}
