import { mapFieldsToModel } from './lib/utils'
import { Campaign, JobRequest, r } from '../models'
import { getUsers } from './user';

export function addCampaignsFilterToQuery(queryParam, campaignsFilter) {
  let query = queryParam
  if (campaignsFilter) {
    if ('isArchived' in campaignsFilter) {
      query = query.where('campaign.is_archived', campaignsFilter.isArchived )
    }
    if ('campaignId' in campaignsFilter) {
      query = query.where('campaign.id', parseInt(campaignsFilter.campaignId, 10))
    }
  }
  return query
}

export function buildCampaignQuery(queryParam, organizationId, campaignsFilter, addFromClause = true) {
  let query = queryParam

  if (addFromClause) {
    query = query.from('campaign')
  }

  query = query.where('organization_id', organizationId)
  query = addCampaignsFilterToQuery(query, campaignsFilter)

  return query
}

export async function getCampaigns(organizationId, cursor, campaignsFilter) {

  let campaignsQuery = buildCampaignQuery(
    r.knex.select('*'),
    organizationId,
    campaignsFilter
  )
  campaignsQuery = campaignsQuery.orderBy('due_by', 'desc').orderBy('id')

  if (cursor) {
    campaignsQuery = campaignsQuery.limit(cursor.limit).offset(cursor.offset)
    const campaigns = await campaignsQuery

    const campaignsCountQuery = buildCampaignQuery(
      r.knex.count('*'),
      organizationId,
      campaignsFilter)

    const campaignsCountArray = await campaignsCountQuery

    const pageInfo = {
      limit: cursor.limit,
      offset: cursor.offset,
      total: campaignsCountArray[0].count
    }
    return {
      campaigns,
      pageInfo
    }
  } else {
    return campaignsQuery
  }
}

export const resolvers = {
  JobRequest: {
    ...mapFieldsToModel([
      'id',
      'assigned',
      'status',
      'jobType',
      'resultMessage'
    ], JobRequest)
  },
  CampaignStats: {
    sentMessagesCount: async (campaign) => (
      r.table('assignment')
        .getAll(campaign.id, { index: 'campaign_id' })
        .eqJoin('id', r.table('message'), { index: 'assignment_id' })
        .filter({ is_from_contact: false })
        .count()
        // TODO: NEEDS TESTING
        // this is a change to avoid very weird map(...).sum() pattern
        // that will work better with RDBMs
        // main question is will/should filter work, or do we need to specify,
        // e.g. 'right_is_from_contact': false, or something
        // .map((assignment) => (
        //   r.table('message')
        //     .getAll(assignment('id'), { index: 'assignment_id' })
        //     .filter({ is_from_contact: false })
        //     .count()
        // )).sum()
    ),
    receivedMessagesCount: async (campaign) => (
      r.table('assignment')
        .getAll(campaign.id, { index: 'campaign_id' })
        // TODO: NEEDSTESTING -- see above setMessagesCount()
        .eqJoin('id', r.table('message'), { index: 'assignment_id' })
        .filter({ is_from_contact: true })
        .count()
    ),
    optOutsCount: async (campaign) => (
      await r.getCount(
        r.knex('campaign_contact')
          .where({ is_opted_out: true, campaign_id: campaign.id })
      )
    )
  },
  CampaignsReturn: {
    __resolveType(obj, context, _) {
      if (Array.isArray(obj)) {
        return 'CampaignsList'
      } else if ('campaigns' in obj && 'pageInfo' in obj) {
        return 'PaginatedCampaigns'
      }
      return null
    }
  },
  CampaignsList: {
    campaigns: campaigns => {
      return campaigns
    }
  },
  PaginatedCampaigns: {
    campaigns: queryResult => {
      return queryResult.campaigns
    },
    pageInfo: queryResult => {
      if ('pageInfo' in queryResult) {
        return queryResult.pageInfo
      }
      return null
    }
  },
  Campaign: {
    ...mapFieldsToModel([
      'id',
      'title',
      'description',
      'dueBy',
      'isStarted',
      'isArchived',
      'useDynamicAssignment',
      'introHtml',
      'primaryColor',
      'logoImageUrl',
      'overrideOrganizationTextingHours',
      'textingHoursEnforced',
      'textingHoursStart',
      'textingHoursEnd',
      'timezoneIfNoZipcode'
    ], Campaign),
    organization: async (campaign, _, { loaders }) => (
      loaders.organization.load(campaign.organization_id)
    ),
    datawarehouseAvailable: (campaign, _, { user }) => (
      user.is_superadmin && !!process.env.WAREHOUSE_DB_HOST
    ),
    pendingJobs: async (campaign) => r.table('job_request')
      .filter({ campaign_id: campaign.id }).orderBy('updated_at', 'desc'),
    texters: async (campaign) =>
      getUsers(campaign.organization_id, null, {campaignId: campaign.id }) ,
    assignments: async (campaign, {assignmentsFilter} ) => {
      let query = r.table('assignment')
        .getAll(campaign.id, { index: 'campaign_id' })

      if (assignmentsFilter && assignmentsFilter.hasOwnProperty('texterId') && assignmentsFilter.textId !== null) {
        query = query.filter({ user_id: assignmentsFilter.texterId })
      }

      return query
    },
    interactionSteps: async (campaign) => (
      r.table('interaction_step')
        .getAll(campaign.id, { index: 'campaign_id' })
        .filter({ is_deleted: false })
    ),
    cannedResponses: async (campaign, { userId }) => (
      r.table('canned_response')
        .getAll(campaign.id, { index: 'campaign_id' })
        .filter({ user_id: userId || '' })
    ),
    contacts: async (campaign) => (
      r.knex('campaign_contact')
        .where({ campaign_id: campaign.id })
    ),
    contactsCount: async (campaign) => (
      await r.getCount(
        r.knex('campaign_contact')
          .where({ campaign_id: campaign.id })
      )
    ),
    hasUnassignedContacts: async (campaign) => {
      const contacts = await r.knex('campaign_contact')
        .select('id')
        .where({ campaign_id: campaign.id, assignment_id: null })
        .limit(1)
      return contacts.length > 0
    },
    customFields: async (campaign) => {
      const campaignContacts = await r.table('campaign_contact')
        .getAll(campaign.id, { index: 'campaign_id' })
        .limit(1)
      if (campaignContacts.length > 0) {
        return Object.keys(JSON.parse(campaignContacts[0].custom_fields))
      }
      return []
    },
    stats: async (campaign) => campaign
  }
}
