import { CampaignContact, r } from '../models'
import { mapFieldsToModel } from './lib/utils'
import { getTopMostParent } from '../../lib'

export const schema = `
  input ContactsFilter {
    messageStatus: String
    isOptedOut: Boolean
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
    assignmentId: String
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
    hasDST: (zipCode) => zipCode.has_dst,
  },
  CampaignContact: {
    ...mapFieldsToModel([
      'id',
      'firstName',
      'lastName',
      'cell',
      'zip',
      'customFields',
      'messageStatus',
      'assignmentId'
    ], CampaignContact),

    campaign: async (campaignContact, _, { loaders }) => (
      loaders.campaign.load(campaignContact.campaign_id)
    ),
    // To get that result to look like what the original code returned 
    // without using the outgoing answer_options array field, try this:
    //
    questionResponses: async (campaignContact, _, { loaders }) => {

      const results = await r.table('question_response')
        .getAll(campaignContact.id, { index: 'campaign_contact_id'})
        .eqJoin('interaction_step_id', r.table('interaction_step'))
        .zip()
        .innerJoin(r.table('interaction_step'), function(left, right) {
          return left('interaction_step_id').eq(right( 'parent_interaction_id'))
        })
      
      let formatted = {}

      for (let i = 0; i < results.length; i++) {

        const responseId = results[i]['left']['id']
        const responseValue = results[i].left.value
        const answerValue = results[i].right.answer_option
        const interactionStepId = results[i].right.id

        if (responseId in formatted) {
          formatted[responseId]['parent_interaction_step']['answer_options'].push({
            "value": answerValue,
            "interaction_step_id": interactionStepId
          })
          if (responseValue === answerValue) {
            formatted[responseId]['interaction_step_id'] = interactionStepId
          }
        } else {
          const answerOption = ""
          const answerOptions = []
          answerOptions.push({
            "value": answerValue, 
            "interaction_step_id": interactionStepId
          })
          const campaignId = results[i].left.campaign_id
          const createdAt = results[i].left.created_at
          const questionStepId = results[i].left.interaction_step_id
          const questionStepParentInteractionId = results[i].right.parent_interaction_id
          const question = results[i].left.question
          const script = results[i].left.script

          formatted[responseId] = {
            "contact_response_value": responseValue,
            "interaction_step_id": interactionStepId,
            "parent_interaction_step": {
                "answer_option": answerOption,
                "answer_options": answerOptions,
                "campaign_id": campaignId,
                "created_at": createdAt,
                "id": responseId,
                "parent_interaction_id": questionStepParentInteractionId,
                "question": question,
                "script": script
            },
            "value":  responseValue
          }
        }
      }
      return Object.values(formatted)
    },
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
    ),
  }
}
