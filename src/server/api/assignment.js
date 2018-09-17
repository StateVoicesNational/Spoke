import { mapFieldsToModel } from './lib/utils'
import { Assignment, r, cacheableData } from '../models'
import { dbGetContactsQuery as getContacts } from '../models/cacheable_queries/assignment-contacts'

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
    contactsCount: async (assignment, { contactsFilter }, { loaders }) => {
      const campaign = await loaders.campaign.load(assignment.campaign_id)
      const organization = await loaders.campaign.load(campaign.organization_id)
      return await cacheableData.assignment.getContacts(
        assignment, contactsFilter, organization, campaign, false, true)
    },
    contacts: async (assignment, { contactsFilter }, { loaders }, graphqlRequest) => {
      const justNeedContactIds = graphqlQueryJustContactIds(graphqlRequest.operation)

      const campaign = await loaders.campaign.load(assignment.campaign_id)
      const organization = await loaders.campaign.load(campaign.organization_id)
      return await cacheableData.assignment.getContacts(
        assignment, contactsFilter, organization, campaign, false, false, justNeedContactIds)
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
