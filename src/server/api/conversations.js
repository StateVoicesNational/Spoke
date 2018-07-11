import _ from 'lodash'
import { r } from '../models'
import { addWhereClauseForContactsFilterMessageStatusIrrespectiveOfPastDue } from './assignment'

export const schema = `
  input ConversationFilter {
    assignmentsFilter: AssignmentsFilter
    campaignsFilter: CampaignsFilter
    contactsFilter: ContactsFilter
  }

  type Conversation {
    texter: User!
    contact: CampaignContact!
    campaign: Campaign!
  }
  
  type PaginatedConversations {
    conversations: [Conversation]!
    pageInfo: PageInfo
  }
`
function getConversationsJoinsAndWhereClause(
  queryParam,
  organizationId,
  campaignsFilter,
  assignmentsFilter,
  contactsFilter
) {
  let query = queryParam
    .from('campaign')
    .leftJoin('campaign_contact', 'campaign.id', 'campaign_contact.campaign_id')
    .leftJoin('assignment', 'campaign_contact.assignment_id', 'assignment.id')
    .leftJoin('user', 'assignment.user_id', 'user.id')
    .where({ 'campaign.organization_id': organizationId })

  if (campaignsFilter) {
    if ('isArchived' in campaignsFilter && campaignsFilter.isArchived !== null) {
      query = query.where({ 'campaign.is_archived': campaignsFilter.isArchived })
    }
    if ('campaignId' in campaignsFilter && campaignsFilter.campaignId !== null) {
      query = query.where({ 'campaign.id': parseInt(campaignsFilter.campaignId) })
    }
  }

  if (assignmentsFilter) {
    if ('texterId' in assignmentsFilter && assignmentsFilter.texterId !== null)
      query = query.where({ 'assignment.user_id': assignmentsFilter.texterId })
  }

  return addWhereClauseForContactsFilterMessageStatusIrrespectiveOfPastDue(query, contactsFilter)
}

export async function getConversations(
  cursor,
  organizationId,
  campaignsFilter,
  assignmentsFilter,
  contactsFilter,
  utc
) {
  let query = r.knex.select(
    'campaign_contact.id as cc_id',
    'campaign_contact.first_name as cc_first_name',
    'campaign_contact.last_name as cc_last_name',
    'campaign_contact.message_status',
    'campaign_contact.is_opted_out',
    'campaign_contact.updated_at',
    'campaign_contact.cell',
    'campaign_contact.assignment_id',
    'user.id as u_id',
    'user.first_name as u_first_name',
    'user.last_name as u_last_name',
    'campaign.id as cmp_id',
    'campaign.title',
    'campaign.due_by',
    'assignment.id as ass_id'
  )

  query = getConversationsJoinsAndWhereClause(
    query,
    organizationId,
    campaignsFilter,
    assignmentsFilter,
    contactsFilter
  )

  query = query.orderBy('campaign_contact.updated_at').orderBy('cc_id')
  query = query.limit(cursor.limit).offset(cursor.offset)

  const conversations = await query

  const countQuery = r.knex.count('*')
  const conversationsCountArray = await getConversationsJoinsAndWhereClause(
    countQuery,
    organizationId,
    campaignsFilter,
    assignmentsFilter,
    contactsFilter
  )
  const pageInfo = {
    limit: cursor.limit,
    offset: cursor.offset,
    total: conversationsCountArray[0].count
  }

  return {
    conversations,
    pageInfo
  }
}

/*
This is necessary because the SQL query that provides the data for this resolver
is a join across several tables with non-unique column names.  In the query, we
alias the column names to make them unique.  This function creates a copy of the
results, replacing keys in the fields map with the original column name, so the
results can be consumed by downstream resolvers.
 */
function mapQueryFieldsToResolverFields(queryResult, fieldsMap) {
  return _.mapKeys(queryResult, (value, key) => {
    const newKey = fieldsMap[key]
    if (newKey) {
      return newKey
    }
    return key
  })
}

export const resolvers = {
  PaginatedConversations: {
    conversations: queryResult => {
      return queryResult.conversations
    },
    pageInfo: queryResult => {
      if ('pageInfo' in queryResult) {
        return queryResult.pageInfo
      } else {
        return null
      }
    }
  },
  Conversation: {
    texter: queryResult => {
      return mapQueryFieldsToResolverFields(queryResult, {
        u_id: 'id',
        u_first_name: 'first_name',
        u_last_name: 'last_name'
      })
    },
    contact: queryResult => {
      return mapQueryFieldsToResolverFields(queryResult, {
        cc_id: 'id',
        cc_first_name: 'first_name',
        cc_last_name: 'last_name'
      })
    },
    campaign: queryResult => {
      return mapQueryFieldsToResolverFields(queryResult, { cmp_id: 'id' })
    }
  }
}
