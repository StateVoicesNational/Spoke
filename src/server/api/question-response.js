import { mapFieldsToModel } from './lib/utils'
import { QuestionResponse } from '../models'

export const schema = `
  type QuestionResponse {
    id: String
    value: String
    question: Question
  }
`

export const resolvers = {
  QuestionResponse: {
    ...mapFieldsToModel([
      'id',
      'value'
    ], QuestionResponse)
  }
}
