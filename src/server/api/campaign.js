import { mapFieldsToModel } from './lib/utils'
import { Campaign, r } from '../models'

export const schema = `
  type CampaignStats {
    sentMessagesCount: Int
    receivedMessagesCount: Int
  }

  type Campaign {
    id: ID
    organization: Organization
    title: String
    description: String
    dueBy: Date
    isStarted: Boolean
    texters: [User]
    assignments: [Assignment]
    interactionSteps: [InteractionStep]
    contacts: [CampaignContact]
    contactsCount: Int
    customFields: [String]
    cannedResponses(userId: String): [CannedResponse]
    stats: CampaignStats
  }
`

export const resolvers = {
  CampaignStats: {
    sentMessagesCount: async (campaign) => (
      r.table('assignment')
        .getAll(campaign.id, { index: 'campaign_id' })
        .map((assignment) => (
          r.table('message')
            .getAll(assignment('id'), { index: 'assignment_id' })
            .filter({ is_from_contact: false })
            .count()
        ))
        .sum()
    ),
    receivedMessagesCount: async (campaign) => (
      r.table('assignment')
        .getAll(campaign.id, { index: 'campaign_id' })
        .map((assignment) => (
          r.table('message')
            .getAll(assignment('id'), { index: 'assignment_id' })
            .filter({ is_from_contact: true })
            .count()
        ))
        .sum()
    )
  },
  Campaign: {
    ...mapFieldsToModel([
      'id',
      'title',
      'description',
      'dueBy',
    ], Campaign),
    organization: async (campaign, _, { loaders }) => (
      loaders.organization.load(campaign.organization_id)
    ),
    isStarted: async (campaign) => {
      const count = await r.table('campaign_contact')
        .getAll(campaign.id, { index: 'campaign_id' })
        .filter(r.row('assignment_id').ne(''))
        .limit(1)
        .count()
      return count === 1
    },
    texters: async (campaign) => (
      r.table('assignment')
        .getAll(campaign.id, { index: 'campaign_id' })
        .eqJoin('user_id', r.table('user'))('right')
    ),
    assignments: async (campaign) => (
      r.table('assignment')
        .getAll(campaign.id, { index: 'campaign_id' })
    ),
    interactionSteps: async (campaign) => (
      r.table('interaction_step')
        .getAll(campaign.id, { index: 'campaign_id' })
    ),
    cannedResponses: async (campaign, { userId }) => {
      let responses = r.table('canned_response')
        .getAll(campaign.id, { index: 'campaign_id' })
      if (userId) {
        responses = responses.filter({
          user_id: userId
        })
      } else {
        responses = responses.filter({
          user_id: ''
        })
      }
      return responses
    },
    contacts: async (campaign) => (
      r.table('campaign_contact')
        .getAll(campaign.id, { index: 'campaign_id' })
    ),
    contactsCount: async (campaign) => (
      r.table('campaign_contact')
        .getAll(campaign.id, { index: 'campaign_id' })
        .count()
    ),
    customFields: async (campaign) => {
      const campaignContacts = await r.table('campaign_contact')
        .getAll(campaign.id, { index: 'campaign_id' })
        .limit(1)
      if (campaignContacts.length > 0) {
        return Object.keys(campaignContacts[0].custom_fields)
      }
      return []
    },
    stats: async (campaign) => campaign
  }
}
