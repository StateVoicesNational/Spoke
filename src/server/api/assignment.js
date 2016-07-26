import { mapFieldsToModel } from './lib/utils'
import { Assignment, r } from '../models'
import { defaultTimezoneIsBetweenTextingHours, validOffsets } from '../../lib/timezones'

export const schema = `
  type Assignment {
    id: ID
    texter: User
    campaign: Campaign
    contacts(contactFilter: String): [CampaignContact]
    unmessagedCount: Int
    unrepliedCount: Int
    badTimezoneCount: Int
    userCannedResponses: [CannedResponse]
    campaignCannedResponses: [CannedResponse]
  }
`

const getValidZips = async () => {
  const offsets = validOffsets()
  let validZips = await r.table('zip_code')
    .filter((doc) => r.expr(offsets)
                      .contains(doc('timezoneOffset')))
    .pluck('zip')

  validZips = validZips.map(({ zip }) => zip)

  if (defaultTimezoneIsBetweenTextingHours()) {
    validZips.push('')
  }

  return validZips
}

export const resolvers = {
  Assignment: {
    ...mapFieldsToModel([
      'id'
    ], Assignment),
    texter: async (assignment, _, { loaders }) => (
      loaders.user.load(assignment.user_id)
    ),
    campaign: async(assignment, _, { loaders }) => loaders.campaign.load(assignment.campaign_id),
    unmessagedCount: async(assignment) => (
      await r.table('campaign_contact')
        .getAll(assignment.id, { index: 'assignment_id'})
        .filter({ message_status: 'needsMessage'})
        .count()
    ),
    unrepliedCount: async(assignment) => (
      await r.table('campaign_contact')
        .getAll(assignment.id, { index: 'assignment_id' })
        .filter({ message_status: 'needsResponse' })
        .count()
    ),
    badTimezoneCount: () => 0,
    contacts: async(assignment, { contactFilter }) => (
        r.table('campaign_contact')
          .getAll(assignment.id, { index: 'assignment_id' })
          .merge((contact) => ({
            opt_out: r.table('opt_out')
              .getAll(contact('cell'), { index: 'cell' })(0)
              .default(false)
          }))
          .filter({
            opt_out: false,
            message_status: contactFilter
          })
    ),
    campaignCannedResponses: async(assignment) => (
      await r.table('canned_response')
        .getAll(assignment.campaign_id, {index: 'campaign_id'})
        .filter({ user_id: '' })
    ),
    userCannedResponses: async(assignment) => (
      await r.table('canned_response')
        .getAll(assignment.campaign_id, {index: 'campaign_id'})
        .filter({ user_id: assignment.user_id })
    )
  }
}
