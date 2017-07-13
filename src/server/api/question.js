import { r } from '../models'

export const schema = `
  type Question {
    text: String
    answerOptions: [AnswerOption]
    interactionStep: InteractionStep
  }

  type AnswerOption {
    value: String
    nextInteractionStep: InteractionStep
    responders: [CampaignContact]
    responderCount: Int
    question: Question
  }
`

export const resolvers = {
  Question: {
    text: async (interactionStep) => interactionStep.question,
    //TODO: need to just query for parent_id = interactionstep.id
    answerOptions: async (interactionStep) => (
      interactionStep.answer_options.map((answer) => ({
        ...answer,
        parent_interaction_step: interactionStep
      }))
    ),
    interactionStep: async (interactionStep) => interactionStep
  },
  AnswerOption: {
    value: (answer) => answer.value,
    nextInteractionStep: async (answer, _, { loaders }) => (loaders.interactionStep.load(answer.interaction_step_id)
    ),
    responders: async (answer) => r.table('question_response')
        .getAll(answer.parent_interaction_step.id, { index: 'interaction_step_id' })
        .filter({
          value: answer.value
        })
        .eqJoin('campaign_contact_id', r.table('campaign_contact'))('right'),
    responderCount: async (answer) => r.table('question_response')
        .getAll(answer.parent_interaction_step.id, { index: 'interaction_step_id' })
        .filter({
          value: answer.value
        })
        .count(),
    question: async (answer) => answer.parent_interaction_step
  }
}
