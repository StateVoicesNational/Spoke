import { mapFieldsToModel } from './lib/utils'
import { InteractionStep, r } from '../models'

export const schema = `
  type InteractionStep {
    id: ID!
    question: Question
    script: String
    questionResponse(campaignContactId: String): QuestionResponse
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
    )
  }
}
