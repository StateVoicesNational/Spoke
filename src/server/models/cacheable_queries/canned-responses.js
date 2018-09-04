import { r } from '../../models'

export const cannedResponseCache = {
  clearQuery: async ({ userId, campaignId }) => {
  },
  query: async ({ userId, campaignId }) => {
    // NEED TO HAVE AN ORDER!
    // db version
      r.table('canned_response')
        .getAll(campaignId, { index: 'campaign_id' })
        .filter({ user_id: userId || '' })
    // cached version should maybe be a  key off of campaign+userId with generic userId=''

  }
}
