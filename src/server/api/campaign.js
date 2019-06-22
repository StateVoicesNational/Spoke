import { accessRequired } from './errors'
import { mapFieldsToModel } from './lib/utils'
import { Campaign, JobRequest, r, cacheableData } from '../models'
import { currentEditors } from '../models/cacheable_queries'
import { getUsers } from './user';


export function addCampaignsFilterToQuery(queryParam, campaignsFilter) {
  let query = queryParam

  if (campaignsFilter) {
    const resultSize = (campaignsFilter.listSize ? campaignsFilter.listSize : 0)
    const pageSize = (campaignsFilter.pageSize ? campaignsFilter.pageSize : 0)

    if ('isArchived' in campaignsFilter) {
      query = query.where('campaign.is_archived', campaignsFilter.isArchived )
    }
    if ('campaignId' in campaignsFilter) {
      query = query.where('campaign.id', parseInt(campaignsFilter.campaignId, 10))
    }
    if (resultSize && !pageSize) {
      query = query.limit(resultSize)
    }
    if (resultSize && pageSize) {
      query = query.limit(resultSize).offSet(pageSize)
    }
  }
  return query
}

export function buildCampaignQuery(queryParam, organizationId, campaignsFilter, addFromClause = true) {
  let query = queryParam

  if (addFromClause) {
    query = query.from('campaign')
  }

  query = query.where('campaign.organization_id', organizationId)
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
    sentMessagesCount: async (campaign, _, { user }) => {
      await accessRequired(user, campaign.organization_id, 'SUPERVOLUNTEER', true)
      return r.table('assignment')
        .getAll(campaign.id, { index: 'campaign_id' })
        .eqJoin('id', r.table('message'), { index: 'assignment_id' })
        .filter({ is_from_contact: false })
        .count()
    },
    receivedMessagesCount: async (campaign, _, { user }) => {
      await accessRequired(user, campaign.organization_id, 'SUPERVOLUNTEER', true)
      return r.table('assignment')
        .getAll(campaign.id, { index: 'campaign_id' })
        // TODO: NEEDSTESTING -- see above setMessagesCount()
        .eqJoin('id', r.table('message'), { index: 'assignment_id' })
        .filter({ is_from_contact: true })
        .count()
    },
    optOutsCount: async (campaign, _, { user }) => {
      await accessRequired(user, campaign.organization_id, 'SUPERVOLUNTEER', true)
      return await r.getCount(
        r.knex('campaign_contact')
          .where({ is_opted_out: true, campaign_id: campaign.id })
      )
    }
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
      'timezone'
    ], Campaign),
    dueBy: (campaign) => (
      (campaign.due_by instanceof Date || !campaign.due_by)
      ? campaign.due_by || null
      : new Date(campaign.due_by)
    ),
    organization: async (campaign, _, { loaders }) => (
      campaign.organization
      || loaders.organization.load(campaign.organization_id)
    ),
    datawarehouseAvailable: (campaign, _, { user }) => (
      user.is_superadmin && !!process.env.WAREHOUSE_DB_HOST
    ),
    pendingJobs: async (campaign, _, { user }) => {
      await accessRequired(user, campaign.organization_id, 'SUPERVOLUNTEER', true)
      return r.table('job_request')
      .filter({ campaign_id: campaign.id }).orderBy('updated_at', 'desc')
    },
    texters: async (campaign, _, { user }) => {
      await accessRequired(user, campaign.organization_id, 'SUPERVOLUNTEER', true)
      return getUsers(campaign.organization_id, null, {campaignId: campaign.id })
    },
    assignments: async (campaign, { assignmentsFilter }, { user }) => {
      await accessRequired(user, campaign.organization_id, 'SUPERVOLUNTEER', true)
      let query = r.table('assignment')
        .getAll(campaign.id, { index: 'campaign_id' })

      if (assignmentsFilter && assignmentsFilter.hasOwnProperty('texterId') && assignmentsFilter.textId !== null) {
        query = query.filter({ user_id: assignmentsFilter.texterId })
      }

      return query
    },
    interactionSteps: async (campaign, _, { user }) => {
      await accessRequired(user, campaign.organization_id, 'TEXTER', true)
      return campaign.interactionSteps
        || cacheableData.campaign.dbInteractionSteps(campaign.id)
    },
    cannedResponses: async (campaign, { userId }, { user }) => {
      await accessRequired(user, campaign.organization_id, 'TEXTER', true)
      return await cacheableData.cannedResponse.query({
        userId: userId || '',
        campaignId: campaign.id
      })
    },
    contacts: async (campaign, _, { user }) => {
      await accessRequired(user, campaign.organization_id, 'ADMIN', true)
      // TODO: should we include a limit() since this is only for send-replies
      return r.knex('campaign_contact')
        .where({ campaign_id: campaign.id })
    },
    contactsCount: async (campaign, _, { user }) => {
      await accessRequired(user, campaign.organization_id, 'SUPERVOLUNTEER', true)
      return await r.getCount(
        r.knex('campaign_contact')
          .where({ campaign_id: campaign.id })
      )
    },
    hasUnassignedContactsForTexter: async (campaign, _, { user }) => {
      // This is the same as hasUnassignedContacts, but the access control
      // is different because for TEXTERs it's just for dynamic campaigns
      // but hasUnassignedContacts for admins is for the campaigns list
      await accessRequired(user, campaign.organization_id, 'TEXTER', true)
      if (!campaign.use_dynamic_assignment || campaign.is_archived) {
        return false
      }
      const contacts = await r.knex('campaign_contact')
        .select('id')
        .where({ campaign_id: campaign.id, assignment_id: null })
        .limit(1)
      return contacts.length > 0
    },
    hasUnassignedContacts: async (campaign, _, { user }) => {
      await accessRequired(user, campaign.organization_id, 'SUPERVOLUNTEER', true)
      const contacts = await r.knex('campaign_contact')
        .select('id')
        .where({ campaign_id: campaign.id, assignment_id: null })
        .limit(1)
      return contacts.length > 0
    },
    hasUnsentInitialMessages: async (campaign, _, { user }) => {
      await accessRequired(user, campaign.organization_id, 'SUPERVOLUNTEER', true)
      const contacts = await r.knex('campaign_contact')
        .select('id')
        .where({
          campaign_id: campaign.id,
          message_status: 'needsMessage',
          is_opted_out: false
        })
        .limit(1)
      return contacts.length > 0
    },
    customFields: async (campaign) => (
      campaign.customFields
      || cacheableData.campaign.dbCustomFields(campaign.id)
    ),
    stats: async (campaign) => campaign,
    cacheable: (campaign, _, { user }) => Boolean(r.redis),
    editors: async (campaign, _, { user }) => {
      await accessRequired(user, campaign.organization_id, 'SUPERVOLUNTEER', true)
      if (r.redis) {
        return cacheableData.campaign.currentEditors(campaign, user)
      }
      return ''
    },
    creator: async (campaign, _, { loaders }) => (
      campaign.creator_id
      ? loaders.user.load(campaign.creator_id)
      : null
    )
  }
}
