import { mapFieldsToModel } from './lib/utils'
import { InteractionStep, r } from '../models'

export const schema = `
  type Question {
    text: String
    answerOptions: [AnswerOption]
  }

  type AnswerOption {
    value: String
    nextInteractionStep: InteractionStep
    responders: [CampaignContact]
    responderCount: Int
  }

  type InteractionStep {
    id: ID!
    question: Question
    script: String
    questionResponse(campaignContactId: String): QuestionResponse
    isCurrentInteractionStep(campaignContactId: String): Boolean
  }
`

export const resolvers = {
  InteractionStep: {
    ...mapFieldsToModel([
      'id',
      'script'
    ], InteractionStep),
    question: async (interactionStep) => interactionStep,
    questionResponse: async (interactionStep, { campaignContactId }) => (
      r.table('question_response')
        .getAll(campaignContactId, { index: 'campaign_contact_id' })
        .filter({
          interaction_step_id: interactionStep.id
        })
        .limit(1)(0)
        .default(null)
    ),
    // isCurrentInteractionStep: () => true
  },
  Question: {
    text: async (interactionStep) => interactionStep.question,
    answerOptions: async (interactionStep) => (
      interactionStep.answer_options.map((answer) => ({
        ...answer,
        parent_interaction_step_id: interactionStep.id
      }))
    )
  },
  AnswerOption: {
    value: (answer) => answer.value,
    nextInteractionStep: async (answer, _, { loaders }) => (loaders.interactionStep.load(answer.interaction_step_id)
    ),
    responders: async (answer) => r.table('question_response')
        .getAll(answer.parent_interaction_step_id, { index: 'interaction_step_id' })
        .filter({
          value: answer.value
        })
        .eqJoin('campaign_contact_id', r.table('campaign_contact'))('right'),
    responderCount: async (answer) => r.table('question_response')
        .getAll(answer.parent_interaction_step_id, { index: 'interaction_step_id' })
        .filter({
          value: answer.value
        })
        .count()
  }
}
