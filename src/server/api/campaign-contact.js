import { CampaignContact, r } from '../models'
import { mapFieldsToModel } from './lib/utils'
import { log, getTopMostParent, zipToTimeZone } from '../../lib'

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
    external_id: String
    customFields: JSON
    messages: [Message]
    location: Location
    optOut: OptOut
    campaign: Campaign
    questionResponseValues: [AnswerOption]
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
    timezone: (zipCode) => zipCode || {},
    city: (zipCode) => zipCode.city || '',
    state: (zipCode) => zipCode.state || ''
  },
  Timezone: {
    offset: (zipCode) => zipCode.timezone_offset || null,
    hasDST: (zipCode) => zipCode.has_dst || null
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
      'assignmentId',
      'external_id'
    ], CampaignContact),

    campaign: async (campaignContact, _, { loaders }) => (
      loaders.campaign.load(campaignContact.campaign_id)
    ),
    // To get that result to look like what the original code returned
    // without using the outgoing answer_options array field, try this:
    //
    questionResponseValues: async (campaignContact, _, { loaders }) => {
      if (campaignContact.message_status === 'needsMessage') {
        return [] // it's the beginning, so there won't be any
      }
      return await r.knex('question_response')
        .where('question_response.campaign_contact_id', campaignContact.id)
        .select('value', 'interaction_step_id')
    },
    questionResponses: async (campaignContact, _, { loaders }) => {
      const results = await r.knex('question_response as qres')
        .where('qres.campaign_contact_id', campaignContact.id)
        .join('interaction_step', 'qres.interaction_step_id', 'interaction_step.id')
        .join('interaction_step as child',
              'qres.interaction_step_id',
              'child.parent_interaction_id')
        .select('child.answer_option',
                'child.id',
                'child.parent_interaction_id',
                'child.created_at',
                'interaction_step.interaction_step_id',
                'interaction_step.campaign_id',
                'interaction_step.question',
                'interaction_step.script',
                'qres.id',
                'qres.value',
                'qres.created_at',
                'qres.interaction_step_id')
        .catch(log.error)

      let formatted = {}

      for (let i = 0; i < results.length; i++) {
        const res = results[i]

        const responseId = res['qres.id']
        const responseValue = res['qres.value']
        const answerValue = res['child.answer_option']
        const interactionStepId = res['child.id']

        if (responseId in formatted) {
          formatted[responseId]['parent_interaction_step']['answer_options'].push({
            'value': answerValue,
            'interaction_step_id': interactionStepId
          })
          if (responseValue === answerValue) {
            formatted[responseId]['interaction_step_id'] = interactionStepId
          }
        } else {
          formatted[responseId] = {
            'contact_response_value': responseValue,
            'interaction_step_id': interactionStepId,
            'parent_interaction_step': {
              'answer_option': '',
              'answer_options': [{ 'value': answerValue,
                                    'interaction_step_id': interactionStepId
                                   }],
              'campaign_id': res['interaction_step.campaign_id'],
              'created_at': res['child.created_at'],
              'id': responseId,
              'parent_interaction_id': res['interaction_step.parent_interaction_id'],
              'question': res['interaction_step.question'],
              'script': res['interaction_step.script']
            },
            'value': responseValue
          }
        }
      }
      return Object.values(formatted)
    },
    location: async (campaignContact, _, { loaders }) => {
      if (campaignContact.timezone_offset) {
        // couldn't look up the timezone by zip record, so we load it
        // from the campaign_contact directly if it's there
        const [offset, hasDst] = campaignContact.timezone_offset.split('_')
        return {
          timezone_offset: parseInt(offset, 10),
          has_dst: (hasDst === '1')
        }
      }
      const mainZip = campaignContact.zip.split('-')[0]
      const calculated = zipToTimeZone(mainZip)
      if (calculated) {
        return {
          timezone_offset: calculated[2],
          has_dst: (calculated[3] === 1)
        }
      }
      return await loaders.zipCode.load(mainZip)
    },
    messages: async (campaignContact) => {
      if (campaignContact.message_status === 'needsMessage') {
        return [] // it's the beginning, so there won't be any
      }
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
        .filter({ is_deleted: false })
      return getTopMostParent(steps, true).id
    },
    currentInteractionStepScript: async (campaignContact) => {
      const steps = await r.table('interaction_step')
        .getAll(campaignContact.campaign_id, { index: 'campaign_id' })
        .filter({ is_deleted: false })
      return getTopMostParent(steps, true).script
    }
  }
}
