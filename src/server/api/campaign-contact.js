import { CampaignContact, r } from '../models'
import { mapFieldsToModel } from './lib/utils'
import { getTopMostParent } from '../../lib'

export const schema = `
  type CampaignContactCollection {
    data: [CampaignContact]
    checksum: String
    count: Int
    customFields: [String]
  }

  type Timezone {
    offset: Int
    hasDST: Boolean
  }

  type Location {
    timezone: Timezone
    city: String
    state: String
  }

  type CampaignContact {
    id: ID
    firstName: String
    lastName: String
    cell: Phone
    zip: String
    customFields: JSON
    messages: [Message]
    needsResponse: Boolean
    location: Location
    assignment: Assignment
    optOut: OptOut
    campaign: Campaign
    interactionSteps: [InteractionStep]
    currentInteractionStepScript: String
    currentInteractionStepId: String
    messageStatus: String
  }
`

export const resolvers = {
  Location: {
    timezone: (zipCode) => zipCode,
    city: (zipCode) => zipCode.city,
    state: (zipCode) => zipCode.state
  },
  Timezone: {
    offset: (zipCode) => zipCode.timezone_offset,
    hasDST: (zipCode) => zipCode.has_dst
  },
  CampaignContact: {
    ...mapFieldsToModel([
      'id',
      'firstName',
      'lastName',
      'cell',
      'zip',
      'customFields',
      'messageStatus'
    ], CampaignContact),

    campaign: async (campaignContact, _, { loaders }) => (
      loaders.campaign.load(campaignContact.campaign_id)
    ),
    location: async (campaignContact, _, { loaders }) => {
      const mainZip = campaignContact.zip.split('-')[0]
      let loc = await loaders.zipCode.load(mainZip)
      console.log(loc, campaignContact.zip)
      return loc
    },
    messages: async (campaignContact) => {
      const messages = await r.table('message')
        .getAll(campaignContact.assignment_id, { index: 'assignment_id' })
        .filter({
          contact_number: campaignContact.cell
        })
        .orderBy('created_at')

      console.log("messages", messages)
      return messages
    },
    optOut: async(campaignContact) => (
      await r.table('opt_out')
        .getAll(campaignContact.cell, { index: 'cell'})
        // .filter(filter by organization ID but I only have assignment_id)
        .limit(1)(0)
        .default(null)
    ),
    currentInteractionStepId: async (campaignContact) => {
      const steps = await r.table('interaction_step')
        .getAll(campaignContact.campaign_id, { index: 'campaign_id' })
      return getTopMostParent(steps, true).id
    },
    currentInteractionStepScript: async (campaignContact) => {
      const steps = await r.table('interaction_step')
        .getAll(campaignContact.campaign_id, { index: 'campaign_id' })
      return getTopMostParent(steps, true).script
    },
    interactionSteps: async (campaignContact) => (
      await r.table('interaction_step')
        .getAll(campaignContact.campaign_id, { index: 'campaign_id' })
    )
  },
  CampaignContactCollection: {
    data: async (campaign) => (
      r.table('campaign_contact')
        .getAll(campaign.id, { index: 'campaign_id' })
    ),
    checksum: (campaign) => campaign.contacts_checksum,
    customFields: async (campaign) => {
      const campaignContacts = await r.table('campaign_contact')
        .getAll(campaign.id, { index: 'campaign_id' })
        .limit(1)
      if (campaignContacts.length > 0) {
        return Object.keys(campaignContacts[0].custom_fields)
      }
      return []
    },
    count: async (campaign) => (
      r.table('campaign_contact')
        .getAll(campaign.id, { index: 'campaign_id' })
        .count()
    )
  }
}
