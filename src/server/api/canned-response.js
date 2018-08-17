import { mapFieldsToModel } from './lib/utils'
import { CannedResponse } from '../models'

export const resolvers = {
  CannedResponse: {
    ...mapFieldsToModel([
      'id',
      'title',
      'text'
    ], CannedResponse),
    isUserCreated: (cannedResponse) => cannedResponse.user_id !== '',
    campaign: (cannedResponse, _, { loaders }) => (loaders.campaign.load(cannedResponse.campaign_id)),
    user: (cannedResponse, _, { loaders }) => (loaders.user.load(cannedResponse.user_id))
  }
}

CannedResponse.ensureIndex('campaign_id')
