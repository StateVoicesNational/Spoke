import { r, getMessageServiceSid, CampaignContact } from '../../models'
import optOutCache from './opt-out'
import { modelWithExtraProps } from './lib'
import { updateAssignmentContact } from './assignment-contacts'
import { Writable } from 'stream'

// TODO: for dynamic assignment, the assignment_id should NOT be set
// -- so it can be loaded before it's assigned
// used below and in sendMessage -- can be loaded from cellTargetKey
// OR with dynamic assignment, we can get it from inflight-sortedset

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

// stores most of the contact info:
const cacheKey = (id) => `${process.env.CACHE_PREFIX || ''}contact-${id}`
// just stores messageStatus -- this changes more often than the rest of the contact info
const messageStatusKey = (id) => `${process.env.CACHE_PREFIX || ''}contactstatus-${id}`
// allows a lookup of contact_id, assignment_id, and timezone_offset by cell+messageservice_sid
const cellTargetKey = (cell, messageServiceSid) => `${process.env.CACHE_PREFIX || ''}cell-${cell}-${messageServiceSid}`

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

const saveCacheRecord = async (dbRecord, organization, messageServiceSid) => {
  if (r.redis) {
    // basic contact record
    const contactCacheObj = generateCacheRecord(dbRecord, organization.id, messageServiceSid)
    // console.log('contact saveCacheRecord', contactCacheObj)
    const contactKey = cacheKey(dbRecord.id)
    const statusKey = messageStatusKey(dbRecord.id)
    const [statusKeyExists] = await r.redis.multi()
      .exists(statusKey)
      .set(contactKey, JSON.stringify(contactCacheObj))
      .expire(contactKey, 86400)
      .execAsync()
    if (dbRecord.message_status) {
      // FUTURE: To avoid a write-syncing risk, before updating the status
      // we should check to see it doesn't exist before overwrite
      // This could also cause a problem, if the cache, itself, somehow gets out-of-sync
      await r.redis.multi()
        .set(statusKey, dbRecord.message_status)
        .expire(statusKey, 86400)
        .execAsync()
      await updateAssignmentContact(dbRecord, dbRecord.message_status)
    }
  }
  // NOT INCLUDED: (All SET on first-text (i.e. updateStatus) rather than initial save)
  // - cellTargetKey <cell><messageservice_sid>: to not steal the cell from another campaign "too early"
  // - messages <contact_id>: because it's empty, dur
  // - questionResponseValues <contact_id>: also empty, dur
}

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
  return (contact && contact.message_status)
}

const campaignContactCache = {
  clear: async (id) => {
    if (r.redis) {
      await r.redis.delAsync(cacheKey(id), messageStatusKey(id))
    }
  },
  load: async(id) => {
    if (r.redis) {
      const cacheRecord = await r.redis.getAsync(cacheKey(id))
      if (cacheRecord) {
        // console.log('contact cacheRecord', cacheRecord)
        const cacheData = JSON.parse(cacheRecord)
        if (cacheData.cell && cacheData.organization_id) {
          cacheData.is_opted_out = await optOutCache.query({
            cell: cacheData.cell,
            organizationId: cacheData.organization_id })
        }
        cacheData.message_status = await getMessageStatus(id, cacheData)
        // console.log('contact fromCache', cacheData)
        return modelWithExtraProps(
          cacheData,
          CampaignContact,
          ['organization_id', 'city', 'state', 'user_id', 'messageservice_sid'])
      }
    }
    return await CampaignContact.get(id)
  },
  loadMany: async (organization, { campaign, queryFunc, remainingMilliseconds }) => {
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
    const messageServiceSid = getMessageServiceSid(organization)

    // We process the results in a stream, because this could be a very large result
    // For docs see:
    // https://knexjs.org/#Interfaces-Streams
    // https://github.com/substack/stream-handbook#creating-a-writable-stream
    await query.stream((stream) => {
      const cacheSaver = new Writable({ objectMode: true })
      // eslint-disable-next-line no-underscore-dangle
      cacheSaver._write = (dbRecord, enc, next) => {
        // Note: non-async land
        saveCacheRecord(dbRecord, organization, messageServiceSid)
          .then(
            () => {
              // If we are passed a remainingMilliseconds function, then
              // run it and see if we're almost at-time.
              // The rest of the cache loading will have to be done later
              // FUTURE: consider making this a job that can divide work up and complete
              if (typeof remainingMilliseconds === 'function'
                  && remainingMilliseconds() < 2000) {
                stream.end()
              }
              next()
            },
            (err) => {
              console.error('FAILED CACHE SAVE', err)
              stream.end()
              next()
            })
      }
      stream.pipe(cacheSaver)
    })
  },
  lookupByCell: async (cell, service, messageServiceSid, bailWithoutCache) => {
    // Used to lookup contact/campaign information by cell number for incoming messages
    // in order to map it to the existing campaign, since Twilio, etc "doesn't know"
    // what campaign or other objects this is.
    // In non-cache settings, this is done through looking up the last message
    // that was sent to the cell phone.  Since Spoke always accepts "just replies"
    // after an initial outgoing message, there should always be a 'last message'
    // The cached version uses the info added in the updateStatus (of a contact) method below
    // which is called for incoming AND outgoing messages.
    if (r.redis) {
      const cellData = await r.redis.getAsync(
        cellTargetKey(cell, messageServiceSid))
      if (cellData) {
        // eslint-disable-next-line camelcase
        const [campaign_contact_id, assignment_id, timezone_offset] = cellData.split(':')
        return {
          campaign_contact_id,
          assignment_id,
          timezone_offset,
          message_status: await getMessageStatus(campaign_contact_id)
        }
      }
      if (bailWithoutCache) {
        return false
      }
    }
    const [lastMessage] = await r.knex('message')
      .select('assignment_id', 'campaign_contact_id')
      .where({
        is_from_contact: false,
        contact_number: cell,
        service
      })
      .where(function subquery() {
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
    return false
  },
  getMessageStatus,
  updateStatus: async (contact, newStatus) => {
    // console.log('updateSTATUS', contact, newStatus)
    if (r.redis) {
      const contactKey = cacheKey(contact.id)
      const statusKey = messageStatusKey(contact.id)
      // NOTE: contact.messageservice_sid is not a field, but will have been
      //       added on to the contact object from message.save
      // Other contexts don't really need to update the cell key -- just the status
      const cellKey = cellTargetKey(contact.cell, contact.messageservice_sid)
      // console.log('contact updateStatus', cellKey, newStatus, contact)
      await r.redis.multi()
        .set(statusKey, newStatus)
      // We update the cell info on status updates, because this happens
      // during message sending -- this is exactly the moment we want to
      // 'steal' a cell from one (presumably older) campaign into another
        .set(cellKey,
             [contact.id, contact.assignment_id, contact.timezone_offset].join(':'))
      // delay expiration for contacts we continue to update
        .expire(contactKey, 86400)
        .expire(statusKey, 86400)
        .expire(cellKey, 86400)
        .execAsync()
      await updateAssignmentContact(contact, newStatus)
    }
    // console.log('updateStatus, CONTACT', contact)
    await r.knex('campaign_contact')
      .where('id', contact.id)
      .update({ message_status: newStatus, updated_at: 'now()' })
  }
}

export default campaignContactCache
