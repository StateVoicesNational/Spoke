import { mapFieldsToModel } from './lib/utils'
import { Campaign, JobRequest, r, cacheableData } from '../models'

export function buildCampaignQuery(queryParam, organizationId, campaignsFilter, addFromClause = true) {
  let query = queryParam

  if (addFromClause) {
    query = query.from('campaign')
  }

  query = query.where('organization_id', organizationId)

  if (campaignsFilter) {
    const resultSize = (campaignsFilter.listSize ? campaignsFilter.listSize : 0)
    const pageSize = (campaignsFilter.pageSize ? campaignsFilter.pageSize : 0)
    
    if ('isArchived' in campaignsFilter) {
      query = query.where({ is_archived: campaignsFilter.isArchived })
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
    pendingJobs: async (campaign) => r.table('job_request')
      .filter({ campaign_id: campaign.id }).orderBy('updated_at', 'desc'),
    texters: async (campaign) => (
      r.table('assignment')
        .getAll(campaign.id, { index: 'campaign_id' })
        .eqJoin('user_id', r.table('user'))('right')
    ),
    assignments: async (campaign, { assignmentsFilter }) => {
      let query = r.table('assignment')
        .getAll(campaign.id, { index: 'campaign_id' })

      if (assignmentsFilter && assignmentsFilter.hasOwnProperty('texterId') && assignmentsFilter.textId !== null) {
        query = query.filter({ user_id: assignmentsFilter.texterId })
      }

      return query
    },
    interactionSteps: async (campaign) => {
      console.log('interactionSteps, campaign', campaign)
      return campaign.interactionSteps
        || cacheableData.campaign.dbInteractionSteps(campaign.id)
    },
    cannedResponses: async (campaign, { userId }) => (
      await cacheableData.cannedResponse.query({
        userId: userId || '',
        campaignId: campaign.id
      })
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
    customFields: async (campaign) => (
      campaign.customFields
      || cacheableData.campaign.dbCustomFields(campaign.id)
    ),
    stats: async (campaign) => campaign,
    editors: async (campaign, _, { user }) => {
      if (r.redis) {
        return cacheableData.campaign.currentEditors(r.redis, campaign, user)
      }
      return ''
    }
  }
}
