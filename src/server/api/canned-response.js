import { mapFieldsToModel } from './lib/utils'
import { CannedResponse } from '../models'

export const resolvers = {
  CannedResponse: {
    ...mapFieldsToModel([
      'id',
      'title',
      'text'
    ], CannedResponse),
    isUserCreated: (cannedResponse) => cannedResponse.user_id !== ''
  }
}

CannedResponse.ensureIndex('campaign_id')
