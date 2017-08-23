import { r } from '../models'

export const schema = `
  type Question {
    text: String
    answerOptions: [AnswerOption]
    interactionStep: InteractionStep
  }

  type AnswerOption {
    value: String
    action: String
    nextInteractionStep: InteractionStep
    responders: [CampaignContact]
    responderCount: Int
    question: Question
  }
`

export const resolvers = {
  Question: {
    text: async (interactionStep) => interactionStep.question,
    answerOptions: async (interactionStep) => (
      r.table('interaction_step')
        .filter({parent_interaction_id: interactionStep.id})
        .map({
          value: r.row('answer_option'),
          action: r.row('answer_actions'),
          interaction_step_id: r.row('id'),
          parent_interaction_step: r.row('parent_interaction_id')
        })
    ),
    interactionStep: async (interactionStep) => interactionStep
  },
  AnswerOption: {
    value: (answer) => answer.value,
    nextInteractionStep: async (answer) => r.table('interaction_step').get(answer.interaction_step_id),
    responders: async (answer) => (
      r.table('question_response')
        .getAll(answer.parent_interaction_step, { index: 'interaction_step_id' })
        .filter({
          value: answer.value
        })
        .eqJoin('campaign_contact_id', r.table('campaign_contact'))('right')
    ),
    responderCount: async (answer) => (
      r.table('question_response')
        .getAll(answer.parent_interaction_step, { index: 'interaction_step_id' })
        .filter({
          value: answer.value
        })
        .count()
    ),
    question: async (answer) => answer.parent_interaction_step
  }
}
