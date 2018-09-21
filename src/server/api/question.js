import { r } from '../models'

export const resolvers = {
  Question: {
    text: async (interactionStep) => interactionStep.question,
    answerOptions: async (interactionStep) => {
      console.log('ANSWER OPTIONS graphQL', interactionStep)
      return interactionStep.answerOptions
      || r.table('interaction_step')
        .filter({ parent_interaction_id: interactionStep.id })
        .filter({ is_deleted: false })
        .orderBy('answer_option')
        .map({
          value: r.row('answer_option'),
          action: r.row('answer_actions'),
          interaction_step_id: r.row('id'),
          parent_interaction_step: r.row('parent_interaction_id')
        })
    },
    interactionStep: async (interactionStep) => interactionStep
  },
  AnswerOption: {
    value: (answer) => answer.value,
    interactionStepId: (answer) => answer.interaction_step_id,
    nextInteractionStep: async (answer) => (
      answer.nextInteractionStep
      || r.table('interaction_step').get(answer.interaction_step_id)),
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
