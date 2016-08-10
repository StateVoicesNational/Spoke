import { mapFieldsToModel } from './lib/utils'
import { Assignment, r } from '../models'
import { defaultTimezoneIsBetweenTextingHours, validOffsets } from '../../lib/timezones'

export const schema = `
  type Assignment {
    id: ID
    texter: User
    campaign: Campaign
    contacts(contactsFilter: ContactsFilter): [CampaignContact]
    contactsCount(contactsFilter: ContactsFilter): Int
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

function getContacts(assignment, campaign, contactsFilter) {
  const filter = {}
  if (contactsFilter) {
    if (contactsFilter.validTimezone === false) {
      filter.zip = 'invalid_zip'
    }
    if (contactsFilter.hasOwnProperty('optOut') && contactsFilter.optOut !== null) {
      filter.opt_out = contactsFilter.optOut
    }
    if (contactsFilter.hasOwnProperty('messageStatus') && contactsFilter.messageStatus !== null) {
      filter.message_status = contactsFilter.messageStatus
    }
  }

  return r.table('campaign_contact')
    .getAll(assignment.id, { index: 'assignment_id' })
    .merge((contact) => ({
      opt_out: r.table('opt_out')
        .getAll(contact('cell'), { index: 'cell' })
        .filter({ organization_id: campaign.oranization_id })
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

    contactsCount: async (assignment, { contactsFilter }, { loaders }) => {
      const campaign = await loaders.campaign.load(assignment.campaign_id)
      return getContacts(assignment, campaign, contactsFilter).count()
    },

    contacts: async (assignment, { contactsFilter }, { loaders }) => {
      const campaign = await loaders.campaign.load(assignment.campaign_id)
      return getContacts(assignment, campaign, contactsFilter)
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
