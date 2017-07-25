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
    answerOptions: async (interactionStep) => (
      r.table('interaction_step')
      .filter({parent_interaction_id: interactionStep.id})
        .eqJoin('parent_interaction_id', r.table('interaction_step'))
        .pluck({'left': ['answer_option', 'id', 'parent_interaction_id']})
        .zip()
        .map({
          value: r.row('answer_option'),
          interaction_step_id: r.row('id'),
          parent_interaction_step: r.row('parent_interaction_id')
        })
    ),
    interactionStep: async (interactionStep) => interactionStep
  },
  AnswerOption: {
    value: (answer) => answer.value,
    nextInteractionStep: async (answer, _, { loaders }) => (loaders.interactionStep.load(answer.interaction_step_id)
    ),
    // get the interaction step where answer.value matches and the parent interaction id is the same as the current interaction step
    // nextInteractionStep: async (answer) => (
    //   r.table('interaction_step').filter({answer_option: answer.value, id: answer.interaction_step_id})
    // ),
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
