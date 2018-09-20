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
    'campaignId': msg => msg.campaign_id,
    'createdAt': msg => 
      (msg.created_at instanceof Date || !msg.created_at)
      ? msg.created_at || null
      : new Date(msg.created_at),
    'id': msg => (msg.id || 'x')
  }
}
