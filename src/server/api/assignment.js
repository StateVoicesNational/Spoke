import { mapFieldsToModel } from './lib/utils'
import { Assignment, r, cacheableData } from '../models'
import { getOffsets, defaultTimezoneIsBetweenTextingHours } from '../../lib'

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

export function getContacts(assignment, contactsFilter, organization, campaign, forCount = false) {
  // / returns list of contacts eligible for contacting _now_ by a particular user
  const textingHoursEnforced = organization.texting_hours_enforced
  const textingHoursStart = organization.texting_hours_start
  const textingHoursEnd = organization.texting_hours_end

  // 24-hours past due - why is this 24 hours offset?
  const includePastDue = (contactsFilter && contactsFilter.includePastDue)
  const pastDue = (campaign.due_by
                   && Number(campaign.due_by) + 24 * 60 * 60 * 1000 < Number(new Date()))
  const config = { textingHoursStart, textingHoursEnd, textingHoursEnforced }
  const [validOffsets, invalidOffsets] = getOffsets(config)
  if (!includePastDue && pastDue && contactsFilter.messageStatus === 'needsMessage') {
    return []
  }

  let query = r.knex('campaign_contact').where({
    assignment_id: assignment.id
  })

  if (contactsFilter) {
    const validTimezone = contactsFilter.validTimezone
    if (validTimezone !== null) {
      if (validTimezone === true) {
        if (defaultTimezoneIsBetweenTextingHours(config)) {
          // missing timezone ok
          validOffsets.push('')
        }
        query = query.whereIn('timezone_offset', validOffsets)
      } else if (validTimezone === false) {
        if (!defaultTimezoneIsBetweenTextingHours(config)) {
          // missing timezones are not ok to text
          invalidOffsets.push('')
        }
        query = query.whereIn('timezone_offset', invalidOffsets)
      }
    }

    query = addWhereClauseForContactsFilterMessageStatusIrrespectiveOfPastDue(
      query,
      (contactsFilter.messageStatus ||
       (pastDue
        // by default if asking for 'send later' contacts we include only those that need replies
        ? 'needsResponse'
        // we do not want to return closed/messaged
        : 'needsMessageOrResponse'))
    )

    if (Object.prototype.hasOwnProperty.call(contactsFilter, 'isOptedOut')) {
      query = query.where('is_opted_out', contactsFilter.isOptedOut)
    }
  }

  if (!forCount) {
    if (contactsFilter && contactsFilter.messageStatus === 'convo') {
      query = query.orderByRaw('message_status DESC, updated_at DESC')
    } else {
      query = query.orderByRaw('message_status DESC, updated_at')
    }
  }

  return query
}

const findGraphqlContactSelection = (operation) => {
  // Takes in a last-argument graphQL object 'operation' value
  // which includes the 'whole query' in a tree-structure
  // We search the structure recursively for assignment.contacts
  // and return the selection set -- then we can determine which
  // fields are going to be pulled from contacts query
  // contactSelection might look something like
  // [{"kind":"Field","name":{"kind":"Name","value":"id","loc":{"start":906,"end":908}},
  //  "arguments":[],"directives":[],"loc":{"start":906,"end":908}}]

  if (operation.name && operation.name.value === 'assignment' && operation.selectionSet) {
    if (operation.selectionSet) {
      const [contactQuery] = operation.selectionSet.selections.filter((sel) => sel.name.value === 'contacts')
      if (contactQuery) {
        if (contactQuery.selectionSet
            && contactQuery.selectionSet.selections) {
          return {
            found: true,
            contactSelection: contactQuery.selectionSet.selections
          }
        }
      }
    }
  }
  if (operation.selectionSet) {
    const [foundSomething] = operation.selectionSet.selections.map((sel) => {
      if (sel.selectionSet) {
        return findGraphqlContactSelection(sel)
      }
    }).filter((x) => x && x.found)
    if (foundSomething) {
      return foundSomething
    }
  }
}

const graphqlQueryJustContactIds = (operation) => {
  // If we find assignment.contacts query, see if we just ask for ids
  // so we don't need to get all the data
  const foundContacts = findGraphqlContactSelection(operation)
  return (foundContacts
          && foundContacts.found
          && foundContacts.contactSelection.length === 1
          && foundContacts.contactSelection[0].name.value === 'id')
}

export const resolvers = {
  Assignment: {
    ...mapFieldsToModel(['id', 'maxContacts'], Assignment),
    texter: async (assignment, _, { loaders }) => (
      assignment.texter
      ? assignment.texter
      : loaders.user.load(assignment.user_id)
    ),
    campaign: async (assignment, _, { loaders }) => loaders.campaign.load(assignment.campaign_id),
    contactsCount: async (assignment, { contactsFilter }) => {
      const campaign = await loaders.campaign.load(assignment.campaign_id)
      const organization = await loaders.campaign.load(campaign.organization_id)

      return await r.getCount(getContacts(assignment, contactsFilter, organization, campaign, true))
    },
    contacts: async (assignment, { contactsFilter }, { loaders }, graphqlRequest) => {
      const justNeedContactIds = graphqlQueryJustContactIds(graphqlRequest.operation)

      const campaign = await loaders.campaign.load(assignment.campaign_id)
      const organization = await loaders.campaign.load(campaign.organization_id)

      return getContacts(assignment, contactsFilter, organization, campaign)
    },
    campaignCannedResponses: async assignment =>
      await cacheableData.cannedResponse.query({
        userId: '',
        campaignId: assignment.campaign_id
      }),
    userCannedResponses: async assignment =>
      await cacheableData.cannedResponse.query({
        userId: assignment.user_id,
        campaignId: assignment.campaign_id
      })
  }
}
