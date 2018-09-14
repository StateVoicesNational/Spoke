import { getOffsets, defaultTimezoneIsBetweenTextingHours } from '../../../lib'
import { r } from '../index'

export function addWhereClauseForContactsFilterMessageStatusIrrespectiveOfPastDue(
  queryParameter,
  messageStatusFilter
) {
  if (!messageStatusFilter) {
    return queryParameter
  }

  let query = queryParameter
  if (messageStatusFilter === 'needsMessageOrResponse') {
    query.whereIn('message_status', ['needsResponse', 'needsMessage'])
  } else {
    query = query.whereIn('message_status', messageStatusFilter.split(','))
  }
  return query
}

const filterMessageStatuses = (messageStatusFilter) => {
  if (messageStatusFilter) {
    return (messageStatusFilter === 'needsMessageOrResponse'
            ? ['needsMessage', 'needsResponse']
            : messageStatusFilter.split(','))
  }
}

export const getContacts = (assignment, contactsFilter, organization, campaign, forCount, justCount, justIds) => {
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
    return (justCount ? 0 : [])
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
        return (justCount ? 0 : [])
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

  return dbContactsQuery(assignment.id,
                         timezoneOffsets,
                         messageStatuses,
                         contactsFilter && contactsFilter.isOptedOut,
                         forCount,
                         justCount,
                         justIds)
}


const dbContactsQuery = (assignmentId, timezoneOffsets, messageStatuses, isOptedOutFilter, forCount, justCount, justIds) => {
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
    console.log('MESSAGE STATUSES', messageStatuses)
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
