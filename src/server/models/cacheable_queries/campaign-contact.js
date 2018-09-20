import { r, getMessageServiceSid, CampaignContact } from '../../models'
import { optOutCache } from './opt-out'
import { modelWithExtraProps } from './lib'
import { updateAssignmentContact } from './assignment-contacts'

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

// HASH message-<cell>-<campaignId>
//   - messageStatus

// TODO: relocate this method elsewhere

// stores most of the contact info:
const cacheKey = async (id) => `${process.env.CACHE_PREFIX||""}contact-${id}`
// just stores messageStatus -- this changes more often than the rest of the contact info
const messageStatusKey = async (id) => `${process.env.CACHE_PREFIX||""}contactstatus-${id}`
// allows a lookup of contact_id, assignment_id, and timezone_offset by cell+messageservice_sid
const cellTargetKey = async (cell, messageServiceSid) => `${process.env.CACHE_PREFIX||""}cell-${cell}-${messageServiceSid}`

const saveCacheRecord = async (dbRecord, organization, messageServiceSid) => {
  if (r.redis) {
    // basic contact record
    const contactCacheObj = generateCacheRecord(dbRecord, organization.id, messageServiceSid)
    //console.log('generated contact', contactCacheObj)
    await r.redis.setAsync(cacheKey(dbRecord.id), JSON.stringify(contactCacheObj))
    // TODO:
    //   messageStatus-<cell>
  }
  // NOT INCLUDED:
  // - messages <cell><message_service_sid>
  // - questionResponseValues <contact_id>
}

const generateCacheRecord = (dbRecord, organizationId, messageServiceSid) => ({
  // This should be contactinfo that
  // never needs to be updated by an action of the texter or contact
  id: dbRecord.id,
  assignment_id: dbRecord.assignment_id,
  campaign_id: dbRecord.campaign_id,
  organization_id: organizationId,
  messageservice_sid: messageServiceSid,
  user_id: dbRecord.user_id, // assigned user_id
  first_name: dbRecord.first_name,
  last_name: dbRecord.last_name,
  cell: dbRecord.cell,
  custom_fields: dbRecord.custom_fields,
  zip: dbRecord.zip,
  external_id: dbRecord.message_status,
  // explicitly excluding:
  // message_status -- because it will be indexed by cell elsewhere
  // updated_at -- because we will not update it
  timezone_offset: dbRecord.timezone_offset,
  city: dbRecord.city,
  state: dbRecord.state
})

const getMessageStatus = async (id, contactObj) => {
  if (contactObj && contactObj.message_status) {
    return contactObj.message_status
  }
  if (r.redis) {
    const msgStatus = await r.redis.getAsync(messageStatusKey(id))
    if (msgStatus) {
      return msgStatus
    }
  }
  const [contact] = await r.knex('campaign_contact').select('message_status').where('id', id)
  if (contact) {
    return contact.message_status
  }
}

export const campaignContactCache = {
  clear: async (id) => {
    if (r.redis) {
      await r.redis.delAsync(cacheKey(id), messageStatusKey(id))
    }
  },
  load: async(id) => {
    if (r.redis) {
      const cacheRecord = await r.redis.getAsync(cacheKey(id))
      if (cacheRecord) {
        const cacheData = JSON.parse(cacheRecord)
        if (cacheData.cell && cacheData.organization_id) {
          cacheData.is_opted_out = await optOutCache.query({
            cell: cacheData.cell,
            organizationId: cacheData.organization_id })
        }
        cacheData.message_status = await getMessageStatus(id, cacheData)
        //console.log('contact fromCache', cacheData)
        return modelWithExtraProps(
          cacheData,
          CampaignContact,
          ['organization_id', 'city', 'state', 'user_id', 'messageservice_sid'])
      }
    }
    return await CampaignContact.get(id)
  },
  loadMany: async (organization, { campaign, queryFunc }) => {
    // queryFunc(query) has query input of a knex query
    // queryFunc should return a query with added where clauses
    if (!r.redis || !organization || !(campaign || queryFunc)) {
      return
    }
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
    // 2. cache the data
    const messageServiceSid = getMessageServiceSid(organization)
    for (let i=0,l=dbResult.length; i<l; i++) {
      const dbRecord = dbResult[i]
      await saveCacheRecord(dbRecord, organization, messageServiceSid)
    }
  },
  lookupByCell: async (cell, service, messageServiceSid, bailWithoutCache) => {
    if (r.redis) {
      const cellData = await r.redis.getAsync(
        cellTargetKey(cell, messageServiceSid))
      if (cellData) {
        const [campaign_contact_id, assignment_id, timezone_offset] = cellData.split(':')
        const message_status = await getMessageStatus(campaign_contact_id)
        return {
          campaign_contact_id,
          assignment_id,
          timezone_offset,
          message_status
        }
      }
      if (bailWithoutCache) {
        return
      }
    }
    const [lastMessage] = await r.knex('message')
      .select('assignment_id', 'campaign_contact_id')
      .where({
        is_from_contact: false,
        service
      })
      .where(function() {
        // Allow null for active campaigns immediately after post-migration
        // where messageservice_sid may not have been set yet
        return this.where('messageservice_sid', messageServiceSid)
          .orWhereNull('messageservice_sid')
      })
      .orderBy('created_at', 'desc')
      .limit(1)
    if (lastMessage) {
      return {
        assignment_id: lastMessage.assignment_id,
        campaign_contact_id: lastMessage.campaign_contact_id,
        service_id: lastMessage.service_id,
        message_id: lastMessage.id
        // NOTE: no timezone_offset here
        // That's ok, because we only need it in the caching case to update assignment info
      }
    }
  },
  getMessageStatus: getMessageStatus,
  updateStatus: async (contact, newStatus) => {
    if (r.redis) {
      await r.redis.multi()
        .set(messageStatusKey(contact.id), newStatus)
      // We update the cell info on status updates, because this happens
      // during message sending -- this is exactly the moment we want to
      // 'steal' a cell from one (presumably older) campaign into another
        .set(cellTargetKey(contact.cell, contact.messageservice_sid),
             [contact.id, contact.assignment_id, contact.timezone_offset].join(':'))
        .execAsync()
      await updateAssignmentContact(contact, newStatus)
    }
    await r.knex('campaign_contact')
      .where('id', contact.id)
      .update({ message_status: newStatus, updated_at: 'now()' })
  }
}
