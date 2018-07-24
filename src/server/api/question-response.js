import { mapFieldsToModel } from './lib/utils'
import { QuestionResponse } from '../models'

export const resolvers = {
  QuestionResponse: {
    ...mapFieldsToModel([
      'id',
      'value'
    ], QuestionResponse),
    question: async (question, _, { loaders }) =>
      (loaders.question.load(question.id))
  }
}
