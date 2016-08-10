import { CampaignContact, r } from '../models'
import { mapFieldsToModel } from './lib/utils'
import { getTopMostParent } from '../../lib'

export const schema = `
  input ContactFilter {
    messageStatus: String
    optOut: Boolean
    validTimezone: Boolean
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
    location: Location
    optOut: OptOut
    campaign: Campaign
    questionResponses: [AnswerOption]
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
    questionResponses: async (campaignContact) => (
      r.table('question_response')
        .getAll(campaignContact.id, { index: 'campaign_contact_id' })
        .eqJoin('interaction_step_id', r.table('interaction_step'))
        .concatMap((row) => (
          row('right')('answer_options')
            .map((option) => option.merge({
              parent_interaction_step: row('right'),
              contact_response_value: row('left')('value')
            }))
        ))
        .filter((row) => row('value').eq(row('contact_response_value')))
    ),
    location: async (campaignContact, _, { loaders }) => {
      const mainZip = campaignContact.zip.split('-')[0]
      const loc = await loaders.zipCode.load(mainZip)
      return loc
    },
    messages: async (campaignContact) => {
      const messages = await r.table('message')
        .getAll(campaignContact.assignment_id, { index: 'assignment_id' })
        .filter({
          contact_number: campaignContact.cell
        })
        .orderBy('created_at')

      return messages
    },
    optOut: async (campaignContact, _, { loaders }) => {
      const campaign = await loaders.campaign.load(campaignContact.campaign_id)

      return r.table('opt_out')
        .getAll(campaignContact.cell, { index: 'cell' })
        .filter({ organization_id: campaign.organization_id })
        .limit(1)(0)
        .default(null)
    },
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
  }
}
