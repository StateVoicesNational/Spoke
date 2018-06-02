import {mapFieldsToModel} from './lib/utils'
import {Assignment, r} from '../models'
import {getOffsets, defaultTimezoneIsBetweenTextingHours} from '../../lib'

export const schema = `
  input AssignmentsFilter {
    texterId: Int
  }
  type Assignment {
    id: ID
    texter: User
    campaign: Campaign
    contacts(contactsFilter: ContactsFilter): [CampaignContact]
    contactsCount(contactsFilter: ContactsFilter): Int
    userCannedResponses: [CannedResponse]
    campaignCannedResponses: [CannedResponse]
    maxContacts: Int
  }
`

function addWhereClauseForNeedsMessageOrResponse(query) {
  return query.whereIn('message_status', ['needsResponse', 'needsMessage'])
}

function addWhereClauseForMessageStatus(query, messageStatus) {
  return query.where('message_status', messageStatus)
}

export function getContacts(assignment, contactsFilter, organization, campaign) {
  // / returns list of contacts eligible for contacting _now_ by a particular user
  const textingHoursEnforced = organization.texting_hours_enforced
  const textingHoursStart = organization.texting_hours_start
  const textingHoursEnd = organization.texting_hours_end

  // 24-hours past due - why is this 24 hours offset?
  const pastDue = ((Number(campaign.due_by) + 24 * 60 * 60 * 1000) < Number(new Date()))

  const config = {textingHoursStart, textingHoursEnd, textingHoursEnforced}
  const [validOffsets, invalidOffsets] = getOffsets(config)

  let query = r.knex('campaign_contact').where('assignment_id', assignment.id)

  if (contactsFilter) {
    if (contactsFilter.hasOwnProperty('validTimezone') && contactsFilter.validTimezone !== null) {
      if (contactsFilter.validTimezone === true) {
        if (defaultTimezoneIsBetweenTextingHours(config)) {
          // missing timezone ok
          validOffsets.push('')
        }
        query = query.whereIn('timezone_offset', validOffsets)
      } else if (contactsFilter.validTimezone === false) {
        if (!defaultTimezoneIsBetweenTextingHours(config)) {
          // missing timezones are not ok to text
          invalidOffsets.push('')
        }
        query = query.whereIn('timezone_offset', invalidOffsets)
      }
    }

    let includePastDue = false
    if (contactsFilter.hasOwnProperty('includePastDue') && contactsFilter.includePastDue != null) {
      includePastDue = contactsFilter.includePastDue
    }

    if (includePastDue && contactsFilter.hasOwnProperty('messageStatus') && contactsFilter.messageStatus !== null) {
      if (contactsFilter.messageStatus === 'needsMessageOrResponse') {
        query = addWhereClauseForNeedsMessageOrResponse(query)
      }
      else {
        query = addWhereClauseForMessageStatus(contactsFilter.messageStatus)
      }

    } else {
      if (contactsFilter.hasOwnProperty('messageStatus') && contactsFilter.messageStatus !== null) {
        if (pastDue && contactsFilter.messageStatus === 'needsMessage') {
          query = addWhereClauseForMessageStatus(query, '') // stops finding anything after pastDue
        } else if (contactsFilter.messageStatus === 'needsMessageOrResponse') {
          query = addWhereClauseForNeedsMessageOrResponse(query)
            .orderByRaw('message_status DESC, updated_at')
        } else {
          query = addWhereClauseForMessageStatus(query, contactsFilter.messageStatus)
        }
      } else {
        if (pastDue) {
          // by default if asking for 'send later' contacts we include only those that need replies
          query = addWhereClauseForMessageStatus(query, 'needsResponse')
        } else {
          // we do not want to return closed/messaged
          query = addWhereClauseForNeedsMessageOrResponse(query)
        }
      }
    }

    if (contactsFilter.hasOwnProperty('isOptedOut') && contactsFilter.isOptedOut !== null) {
      query = query.where('is_opted_out', contactsFilter.isOptedOut)
    }
  }

  return query
}

export const resolvers = {
  Assignment: {
    ...mapFieldsToModel([
      'id',
      'maxContacts'
    ], Assignment),
    texter: async (assignment, _, {loaders}) => (
      loaders.user.load(assignment.user_id)
    ),
    campaign: async (assignment, _, {loaders}) => loaders.campaign.load(assignment.campaign_id),
    contactsCount: async (assignment, {contactsFilter}) => {
      const campaign = await r.table('campaign').get(assignment.campaign_id)

      const organization = await r.table('organization')
        .get(campaign.organization_id)

      return await r.getCount(getContacts(assignment, contactsFilter, organization, campaign))
    },
    contacts: async (assignment, {contactsFilter}) => {
      const campaign = await r.table('campaign').get(assignment.campaign_id)

      const organization = await r.table('organization')
        .get(campaign.organization_id)
      return getContacts(assignment, contactsFilter, organization, campaign)
    },
    campaignCannedResponses: async (assignment) => (
      await r.table('canned_response')
        .getAll(assignment.campaign_id, {index: 'campaign_id'})
        .filter({user_id: ''})
    ),
    userCannedResponses: async (assignment) => (
      await r.table('canned_response')
        .getAll(assignment.campaign_id, {index: 'campaign_id'})
        .filter({user_id: assignment.user_id})
    )
  }
}
