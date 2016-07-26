import { mapFieldsToModel } from './lib/utils'
import { CannedResponse } from '../models'

export const schema = `
  input CannedResponseInput {
    id: String
    title: String
    text: String
    campaignId: String
    userId: String
  }

  type CannedResponse {
    id: ID
    title: String
    text: String
    isUserCreated: Boolean
    campaign: Campaign
    user: User
  }
`

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
