import { mapFieldsToModel } from './lib/utils'
import { Message } from '../models'

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
