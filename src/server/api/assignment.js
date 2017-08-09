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
    OLDcontactsCount(contactsFilter: ContactsFilter): Int
    contactedCount(contactsFilter: ContactsFilter): Int
    contactsCount(contactsFilter: ContactsFilter): Int
    userCannedResponses: [CannedResponse]
    campaignCannedResponses: [CannedResponse]
  }
`
function getContacts(assignment, contactsFilter, organization, campaign) {
  /// returns list of contacts eligible for contacting _now_ by a particular assignment
  console.log("assignment " + JSON.stringify(assignment))
  console.log("contactsFilter " + JSON.stringify(contactsFilter))
  console.log("organization " + JSON.stringify(organization))
  console.log("campaign " + JSON.stringify(campaign))

  const textingHoursEnforced = organization.texting_hours_enforced
  const textingHoursStart = organization.texting_hours_start
  const textingHoursEnd = organization.texting_hours_end

  // 24-hours past due - why is this 24 hours offset?
  const pastDue = ((Number(campaign.due_by) + 24 * 60 * 60 * 1000) < Number(new Date()))
  console.log("pastDue " + pastDue)
  const getIndexValuesWithOffsets = (offsets) => offsets.map(([offset, hasDST]) => ([
    assignment.id,
    `${offset}_${hasDST}`
  ]))

  let index = 'assignment_id'
  let indexValues = []
  const aid = assignment.user_id
  const cid = campaign.id

  const config = { textingHoursStart, textingHoursEnd, textingHoursEnforced }
  console.log("config - start, end, enforced " + JSON.stringify(config))
  const [validOffsets, invalidOffsets] = getOffsets(config)
  const filter = {}
  let secondaryFilter = null

  let newQuery = r.knex('campaign_contact')
    .where('assignment_id', 'in',
      r.knex('assignment')
        .where({
          user_id: aid,
          campaign_id: cid
        })
        .select('id')
      )
    .select('*')
  console.log("newQuery " + newQuery)

  let textableContactsNow = [] 

  if (contactsFilter) {
    // TODO: indexValues is assuming too-subtle implementation of rethink
    //       so probably need to change to a knex query directly
    if (contactsFilter.hasOwnProperty('validTimezone') && contactsFilter.validTimezone !== null) {
      const index = 'timezone_offset'

      if (contactsFilter.validTimezone === true) {
        newQuery = newQuery.whereIn('timezone_offset', validOffsets)
        console.log("validTimezone = true " + newQuery)
        if (defaultTimezoneIsBetweenTextingHours(config)) {
          // missing timezone ok
          newQuery = newQuery.orWhere('timezone_offset', '')
          console.log("validTimezone = true and blank timezone ok" + newQuery)
        }
      } else if (contactsFilter.validTimezone === false) {
        newQuery = newQuery.whereIn('timezone_offset', invalidOffsets)
        console.log("validTimezone false " + newQuery)
        if (!defaultTimezoneIsBetweenTextingHours(config)) {
          // missing timezones are not ok to text
          newQuery = newQuery.orWhere('campaign_contact.timezone_offset', '')
          console.log("validTimezone false and missing timezones not ok " + newQuery)
        }
      }
    }

    if (contactsFilter.hasOwnProperty('messageStatus') && contactsFilter.messageStatus !== null) {
      console.log("has message Status and it's not null")
      console.log("messageStatus " + contactsFilter.messageStatus)
      if (pastDue && contactsFilter.messageStatus === 'needsMessage') {
        console.log("past Due and needsMessage")
        newQuery = newQuery.where('message_status', '')
        console.log("newQuery2 " + newQuery)
      } else {
        newQuery = newQuery.where('message_status', contactsFilter.messageStatus)
        console.log("newQuery3 " + newQuery)
      }
    } else {
      if (pastDue) {
        // by default if asking for 'send later' contacts we include only those that need replies
        newQuery = newQuery.where('message_status', 'needsResponse')
      } else {
        // we do not want to return closed/messaged
        newQuery = newQuery.whereIn('message_status', ['needsResponse', 'needsMessage'])
      }
    }
    if (contactsFilter.hasOwnProperty('isOptedOut') && contactsFilter.isOptedOut !== null) {
      newQuery = newQuery.where('is_opted_out', contactsFilter.isOptedOut)
    }
  }

  console.log("final query " + newQuery)
  return newQuery
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

    OLDcontactsCount: async (assignment, { contactsFilter }) => {
      // NOTE: does not filter by contactsFilter yet
      return r.table('campaign_contact').filter({ 'assignment_id': assignment.id }).count()
    },

    contactedCount: async (assignment, { contactsFilter }) => {
      // does
      return r.table('campaign_contact')
        .getAll('messaged', 'closed', 'needsResponse', { index: 'message_status' })
        .filter({ 'assignment_id': assignment.id }).count()
    },

    contacts: async (assignment, { contactsFilter }) => {
      const campaign = await r.table('campaign').get(assignment.campaign_id)
      console.log("you're in assignment contacts")
      console.log("contactsFilter " + contactsFilter)

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
