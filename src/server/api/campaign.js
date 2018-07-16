import { mapFieldsToModel } from './lib/utils'
import { Campaign, JobRequest, r } from '../models'

export const schema = `
  input CampaignsFilter {
    isArchived: Boolean
    campaignId: Int
  }

  type CampaignStats {
    sentMessagesCount: Int
    receivedMessagesCount: Int
    optOutsCount: Int
  }

  type JobRequest {
    id: String
    jobType: String
    assigned: Boolean
    status: Int
    resultMessage: String
  }

  type Campaign {
    id: ID
    organization: Organization
    title: String
    description: String
    dueBy: Date
    isStarted: Boolean
    isArchived: Boolean
    texters: [User]
    assignments(assignmentsFilter: AssignmentsFilter): [Assignment]
    interactionSteps: [InteractionStep]
    contacts: [CampaignContact]
    contactsCount: Int
    hasUnassignedContacts: Boolean
    customFields: [String]
    cannedResponses(userId: String): [CannedResponse]
    stats: CampaignStats,
    pendingJobs: [JobRequest]
    datawarehouseAvailable: Boolean
    useDynamicAssignment: Boolean
    introHtml: String
    primaryColor: String
    logoImageUrl: String
  }

  type PaginatedCampaigns {
    campaigns: [Campaign]!
    pageInfo: PageInfo
  }
`
export function buildCampaignQuery(queryParam, organizationId, campaignsFilter, addFromClause = true) {
  let query = queryParam

  if (addFromClause) {
    query = query.from('campaign')
  }

  query = query.where('organization_id', organizationId)

  if (campaignsFilter) {
    if ('isArchived' in campaignsFilter) {
      query = query.where({ is_archived: campaignsFilter.isArchived })
    }
    if ('campaignId' in campaignsFilter) {
      query = query.where({ id: parseInt(campaignsFilter.campaignId, 10) })
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
      'dueBy',
      'isStarted',
      'isArchived',
      'useDynamicAssignment',
      'introHtml',
      'primaryColor',
      'logoImageUrl'
    ], Campaign),
    organization: async (campaign, _, { loaders }) => (
      loaders.organization.load(campaign.organization_id)
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
    assignments: async (campaign, {assignmentsFilter} ) => {
      let query = r.table('assignment')
        .getAll(campaign.id, { index: 'campaign_id' })

      if (assignmentsFilter && assignmentsFilter.hasOwnProperty('texterId') && assignmentsFilter.textId !== null) {
        query = query.filter({user_id: assignmentsFilter.texterId})
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
