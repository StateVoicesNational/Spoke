import { mapFieldsToModel } from './lib/utils'
import { Assignment, r } from '../models'
import { getOffsets, defaultTimezoneIsBetweenTextingHours } from '../../lib'
import moment from 'moment'

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
function getContacts(assignment, contactsFilter, organization, campaign) {
  const textingHoursEnforced = organization.texting_hours_enforced
  const textingHoursStart = organization.texting_hours_start
  const textingHoursEnd = organization.texting_hours_end
  const pastDue = moment(campaign.due_by + 24 * 60 * 60).diff(moment()) < 0
  const getIndexValuesWithOffsets = (offsets) => offsets.map(([offset, hasDST]) => ([
    assignment.id,
    `${offset}_${hasDST}`
  ]))

  let index = 'assignment_id'
  let indexValues = assignment.id

  const config = { textingHoursStart, textingHoursEnd, textingHoursEnforced }
  const [validOffsets, invalidOffsets] = getOffsets(config)
  const filter = {}
  let secondaryFilter = null

  if (contactsFilter) {
    if (contactsFilter.hasOwnProperty('validTimezone') && contactsFilter.validTimezone !== null) {
      index = 'assignment_timezone_offset'

      if (contactsFilter.validTimezone === true) {
        indexValues = getIndexValuesWithOffsets(validOffsets)
        if (defaultTimezoneIsBetweenTextingHours(config)) {
          indexValues.push([assignment.id, '']) // missing timezones are ok to text
        }
      } else if (contactsFilter.validTimezone === false) {
        indexValues = getIndexValuesWithOffsets(invalidOffsets)
        if (!defaultTimezoneIsBetweenTextingHours(config)) {
          indexValues.push([assignment.id, '']) // missing timezones are not ok to text
        }
      }

      indexValues = r.args(indexValues)
    }


    if (contactsFilter.hasOwnProperty('messageStatus') && contactsFilter.messageStatus !== null) {
      if (pastDue && contactsFilter.messageStatus === 'needsMessage') {
        filter.message_status = '' // no results
      } else {
        filter.message_status = contactsFilter.messageStatus
      }
    } else {
      if (pastDue) {
        // by default if asking for 'send later' contacts we include only those that need replies
        filter.message_status = 'needsResponse'
      } else {
        // we do not want to return closed/messaged
        secondaryFilter = (doc) => doc('message_status').eq('needsResponse').or(doc('message_status').eq('needsMessage'))
      }
    }
    if (contactsFilter.hasOwnProperty('isOptedOut') && contactsFilter.isOptedOut !== null) {
      filter.is_opted_out = contactsFilter.isOptedOut
    }
  }

  let query = r.table('campaign_contact')
    .getAll(indexValues, { index })

  query = query.filter(filter)
  if (secondaryFilter) {
    query = query.filter(secondaryFilter)
  }
  return query
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

    contactsCount: async (assignment, { contactsFilter }) => {
      const campaign = await r.table('campaign').get(assignment.campaign_id)

      const organization = await r.table('organization')
        .get(campaign.organization_id)

      return getContacts(assignment, contactsFilter, organization, campaign).count()
    },

    contacts: async (assignment, { contactsFilter }) => {
      const campaign = await r.table('campaign').get(assignment.campaign_id)

      const organization = await r.table('organization')
        .get(campaign.organization_id)
      return getContacts(assignment, contactsFilter, organization, campaign)
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
