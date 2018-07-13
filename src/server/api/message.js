import { mapFieldsToModel } from './lib/utils'
import { Message } from '../models'
import { schema as campaignSchema, resolvers as campaignResolvers } from './campaign'
import { schema as assignmentSchema, resolvers as assignmentResolves } from './assignment'

export const schema = `
  type Message {
    id: ID
    text: String
    userNumber: String
    contactNumber: String
    createdAt: Date
    isFromContact: Boolean
    assignment: Assignment
    campaignId: String
  }
`

export const resolvers = {
  Message: {
    ...mapFieldsToModel([
      'id',
      'text',
      'userNumber',
      'contactNumber',
      'createdAt',
      'isFromContact'
    ], Message),
    'campaignId': (instance) => instance['campaign_id']
  }
}
