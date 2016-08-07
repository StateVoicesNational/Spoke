import { mapFieldsToModel } from './lib/utils'
import { Assignment, r } from '../models'
import { defaultTimezoneIsBetweenTextingHours, validOffsets } from '../../lib/timezones'

export const schema = `
  type AssignmentCampaignContactCollection {
    data(contactFilter:String): [CampaignContact]
    count(contactFilter:String): Int
  }
  type Assignment {
    id: ID
    texter: User
    campaign: Campaign
    contacts: AssignmentCampaignContactCollection
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
    contacts: (assignment) => assignment,
    campaignCannedResponses: async(assignment) => (
      await r.table('canned_response')
        .getAll(assignment.campaign_id, { index: 'campaign_id' })
        .filter({ user_id: '' })
    ),
    userCannedResponses: async(assignment) => (
      await r.table('canned_response')
        .getAll(assignment.campaign_id, { index: 'campaign_id' })
        .filter({ user_id: assignment.user_id })
    )
  },
  AssignmentCampaignContactCollection: {
    data: async (assignment, { contactFilter }) => {
      if ((contactFilter) === 'badTimezone')
        return []

      let filter = {
        opt_out: false
      }
      if (contactFilter) {
        filter = {
          ...filter,
          message_status: contactFilter
        }
      }
      return r.table('campaign_contact')
        .getAll(assignment.id, { index: 'assignment_id' })
        .merge((contact) => ({
          opt_out: r.table('opt_out')
            .getAll(contact('cell'), { index: 'cell' })(0)
            .default(false)
        }))
        .filter(filter)
    },
    count: async(assignment, { contactFilter }) => {
      if ((contactFilter) === 'badTimezone') {
        return 0
      }

      let filter = {
        opt_out: false
      }
      if (contactFilter) {
        filter = {
          ...filter,
          message_status: contactFilter
        }
      }
      return r.table('campaign_contact')
        .getAll(assignment.id, { index: 'assignment_id' })
        .merge((contact) => ({
          opt_out: r.table('opt_out')
            .getAll(contact('cell'), { index: 'cell' })(0)
            .default(false)
        }))
        .filter(filter)
        .count()
    }
  }
}
