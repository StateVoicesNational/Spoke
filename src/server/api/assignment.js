import { mapFieldsToModel } from './lib/utils'
import { Assignment, r } from '../models'
import { defaultTimezoneIsBetweenTextingHours, validOffsets } from '../../lib/timezones'

export const schema = `
  type Assignment {
    id: ID
    texter: User
    campaign: Campaign
    contacts(contactFilter: ContactFilter): [CampaignContact]
    contactsCount(contactFilter: ContactFilter): Int
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

function getContacts(assignment, campaign, contactFilter) {
  const filter = {}
  if (contactFilter) {
    if (contactFilter.validTimezone === false) {
      filter.zip = 'invalid_zip'
    }
    if (contactFilter.hasOwnProperty('optOut') && contactFilter.optOut !== null) {
      filter.opt_out = contactFilter.optOut
    }
    if (contactFilter.hasOwnProperty('messageStatus') && contactFilter.messageStatus !== null) {
      filter.message_status = contactFilter.messageStatus
    }
  }

  return r.table('campaign_contact')
    .getAll(assignment.id, { index: 'assignment_id' })
    .merge((contact) => ({
      opt_out: r.table('opt_out')
        .getAll(contact('cell'), { index: 'cell' })
        .filter({ organization_id: campaign.organization_id })
        .limit(1)(0)
        .default(false)
    }))
    .filter(filter)
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

    contactsCount: async (assignment, { contactFilter }, { loaders }) => {
      const campaign = await loaders.campaign.load(assignment.campaign_id)
      return getContacts(assignment, campaign, contactFilter).count()
    },

    contacts: async (assignment, { contactFilter }, { loaders }) => {
      const campaign = await loaders.campaign.load(assignment.campaign_id)
      return getContacts(assignment, campaign, contactFilter)
    },

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
  }
}
