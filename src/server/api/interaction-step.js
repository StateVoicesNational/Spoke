import { mapFieldsToModel } from './lib/utils'
import { InteractionStep, r } from '../models'

export const resolvers = {
  InteractionStep: {
    ...mapFieldsToModel([
      'id',
      'script',
      'answerOption',
      'answerActions',
      'parentInteractionId',
      'question',
      'isDeleted'
    ], InteractionStep),
    questionText: async(interactionStep) => {
      const interaction = await r.table('interaction_step')
        .get(interactionStep.id)

      return interaction.question
    },
    question: async (interactionStep) => interactionStep,
    questionResponse: async (interactionStep, { campaignContactId }) => (
      r.table('question_response')
        .getAll(campaignContactId, { index: 'campaign_contact_id' })
        .filter({
          interaction_step_id: interactionStep.id
        })
        .limit(1)(0)
        .default(null)
    )
  }
}
