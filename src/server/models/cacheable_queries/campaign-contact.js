import { r } from '../../models'

// <campaignContactId>
//   - assignmentId
//   - campaignId
//   - orgId
//   - userId
//   - messageServiceSid
//   - firstName
//   - lastName
//   - cell
//   - zip
//   - customFields
//   - location{} (join on zip)
//     - city
//     - state
//     - timezone{ offset, hasDST }

//   OTHER DATA
//   - optout
//   - questionResponseValues
//   - messageStatus
//   - messages

// HASH <cell>-data
//   - messageStatus
//   - currentInteractionStepSript
//   - currentInteractionStepId

// TODO: relocate this method elsewhere
const getMessageServiceSid = (organization) => {
  let orgFeatures = {}
  if (organization.features) {
    orgFeatures = JSON.parse(organization.features)
  }
  const orgSid = orgFeatures.message_service_sid
  if (!orgSid) {
    const service = orgFeatures.service || process.env.DEFAULT_SERVICE || ''
    if (service === 'twilio') {
      return process.env.TWILIO_MESSAGE_SERVICE_SID
    }
    return ''
  }
  return orgSid
}

const saveCacheRecord = (dbRecord, organization, messageServiceSid) => {
  // basic contact record
  const contactCacheObj = generateCacheRecord(dbRecord, organization.id, messageServiceSid)
  // messageStatus <cell>
  // scriptStatus <contact_id>
  // NOT INCLUDED:
  // - messages <cell><message_service_sid>
  // - questionResponseValues <contact_id>
  // - optout <cell><organization> ~ opt_out match:{cell, organization}
  // - optout ?<cell><campaign> ~ campaign_contact.is_opted_out
  //   - currently the one below is redundant, because is_opted_out is redundant except for reporting
}

const generateCacheRecord = (dbRecord, organizationId, messageServiceSid) => ({
  // This should be contactinfo that
  // never needs to be updated by an action of the texter or contact
  id: dbRecord.id,
  assignment_id: dbRecord.assignment_id,
  campaign_id: dbRecord.campaign_id,
  organization_id: organizationId,
  message_service_sid: messageServiceSid,
  user_id: dbRecord.user_id,
  first_name: dbRecord.first_name,
  last_name: dbRecord.last_name,
  cell: dbRecord.cell,
  custom_fields: dbRecord.custom_fields,
  zip: dbRecord.zip,
  external_id: dbRecord.message_status,
  // explicitly excluding message_status
  // message_status -- because it will be indexed by cell elsewhere
  timezone_offset: dbRecord.timezone_offset,
  city: dbRecord.city,
  state: dbRecord.state
})

export const campaignContactCache = {
  clear: async (id) => {
  },
  load: async(id) => {
    // Only cache NON-archived campaigns
    //   should clear when archiving is done
    // Should include (see TexterTodo.jsx):
    // * campaignCannedResponses
    // * organization metadata
    // * interactionSteps
    // * customFields
  },
  loadMany: async (organization, { campaign, queryFunc }) => {
    // queryFunc(query) has query input of a knex query
    // queryFunc should return a query with added where clauses

    // 1. load the data
    let query = r.knex('campaign_contact')
      .leftJoin('zip_code', 'zip_code.zip', 'campaign_contact.zip')
      .leftJoin('assignment', 'assignment.id', 'campaign_contact.assignment_id')
      .select('campaign_contact.id',
              'campaign_contact.assignment_id',
              'campaign_contact.campaign_id',
              'assignment.user_id',
              'campaign_contact.first_name',
              'campaign_contact.last_name',
              'campaign_contact.cell',
              'campaign_contact.custom_fields',
              'campaign_contact.zip',
              'campaign_contact.external_id',
              'campaign_contact.message_status',
              'campaign_contact.is_opted_out',
              'campaign_contact.timezone_offset',
              'zip_code.city',
              'zip_code.state')
    if (campaign) {
      query = query.where('campaign_contact.campaign_id', campaign.id)
    }
    if (queryFunc) {
      query = queryFunc(query)
    }
    const dbResult = await query
    console.log(dbResult)
    // 2. cache the data
    const messageServiceSid = getMessageServiceSid(organization)
    for (let i=0,l=dbResult.length; i<l; i++) {
      const dbRecord = dbResult[i]
      saveCacheRecord(dbRecord, organization, messageServiceSid)
    }
  }
}
