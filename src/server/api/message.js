import { mapFieldsToModel } from './lib/utils'
import { Message } from '../models'

export const schema = `
  type Message {
    id: ID
    text: String
    createdAt: Date
    isFromContact: Boolean
  }
`

export const resolvers = {
  Message: {
    ...mapFieldsToModel([
      'id',
      'text',
      'createdAt',
      'isFromContact'
    ], Message)
  }
}
