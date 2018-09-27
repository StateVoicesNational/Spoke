import { r, Message } from '../../models'
import campaignContactCache from './campaign-contact'

// QUEUE
// messages-<contactId>
// Expiration: 24 hours after last message added
//   The message cache starts when the first message is sent initially.
//   After that, presumably a conversation will continue in cache, and then fade away.

// TODO: Does query() need to support other args, or should we simplify/require a contactId

const cacheKey = (contactId) => `${process.env.CACHE_PREFIX || ''}messages-${contactId}`

const dbQuery = ({ campaignId, contactId }) => {
  const cols = Object.keys(Message.fields).filter(f => f !== 'service_response').map(f => `message.${f}`)
  let query = r.knex('message').select(...cols)
  console.log('message dbquery', contactId, cols)
  if (contactId) {
    query = query.where('campaign_contact_id', contactId)
    // TODO: do we need to accomodate active campaigns just after migration here?
    //  probably should include it in the migration
  } else if (campaignId) {
    query = query
      .join('assignment', 'message.assignment_id', 'assignment.id')
      .where('assignment.campaign_id', campaignId)
  }
  return query.orderBy('created_at')
}

const contactIdFromOther = async ({ campaignContactId, assignmentId, cell, service, messageServiceSid }) => {
  if (campaignContactId) {
    return campaignContactId
  }
  console.error('contactIdfromother hard', campaignContactId, assignmentId, cell, service)

  if (!assignmentId || !cell || !messageServiceSid) {
    throw new Error('campaignContactId required or assignmentId-cell-service-messageServiceSid triple required')
  }
  if (r.redis) {
    const cellLookup = await campaignContactCache.lookupByCell(
      cell, service || '', messageServiceSid, /* bailWithoutCache*/ true)
    if (cellLookup) {
      return cellLookup.campaign_contact_id
    }
  }
  // TODO: more ways and by db -- is this necessary if the active-campaign-postmigration edgecase goes away?
  return null
}

const saveMessageCache = async (contactId, contactMessages, overwriteFull) => {
  if (r.redis) {
    const key = cacheKey(contactId)
    let redisQ = r.redis.multi()
    if (overwriteFull) {
      redisQ = redisQ.del(key)
    }

    await redisQ
      .lpush(key, contactMessages.map(
        m => JSON.stringify({ ...m, // don't cache service_response key
                              service_response: undefined })))
      .expire(key, 86400)
      .execAsync()
  }
}

const cacheDbResult = async (dbResult) => {
  // We assume we are getting a result that is comprehensive for each contact
  if (r.redis) {
    const contacts = {}
    dbResult.forEach(m => {
      if (m.campaign_contact_id in contacts) {
        contacts[m.campaign_contact_id].push(m)
      } else {
        contacts[m.campaign_contact_id] = [m]
      }
    })
    const contactIds = Object.keys(contacts)
    for (let i = 0, l = contactIds.length; i < l; i++) {
      const c = contactIds[i]
      await saveMessageCache(c, contacts[c], true)
    }
  }
}

const query = async (queryObj) => {
  // queryObj ~ { campaignContactId, assignmentId, cell, service, messageServiceSid }
  let cid = query.campaignContactId
  // console.log('message query', queryObj)
  if (r.redis) {
    cid = await contactIdFromOther(queryObj)
    if (cid) {
      const [exists, messages] = await r.redis.multi()
        .exists(cacheKey(cid))
        .lrange(cacheKey(cid), 0, -1)
        .execAsync()
      // console.log('cached messages exist?', exists, messages)
      if (exists) {
        // note: lrange returns messages in reverse order
        return messages.reverse().map(m => JSON.parse(m))
      }
    }
  }
  const dbResult = await dbQuery({ contactId: cid })
  await cacheDbResult(dbResult)
  return dbResult
}

const messageCache = {
  clearQuery: async (queryObj) => {
    if (r.redis) {
      const contactId = await contactIdFromOther(queryObj)
      await r.redis.delAsync(cacheKey(contactId))
    }
  },
  query,
  save: async ({ messageInstance, contact }) => {
    // 1. Saves the messageInstance
    // 2. Updates the campaign_contact record with an updated status and updated_at
    // 3. Updates all the related caches
    const contactData = Object.assign({}, contact || {})
    if (messageInstance.is_from_contact) {
      // is_from_contact is a particularly complex conditional
      // This is because we don't have the contact id or other info
      // coming in, but must determine it from cell and messageservice_sid
      const activeCellFound = await campaignContactCache.lookupByCell(
        messageInstance.contact_number,
        messageInstance.service,
        messageInstance.messageservice_sid
      )
      // console.log('activeCellFound', activeCellFound)
      if (!activeCellFound) {
        // No active thread to attach message to. This should be very RARE
        // This could happen way after a campaign is closed and a contact responds 'very late'
        // or e.g. gives the 'number for moveon' to another person altogether that tries to text it.
        console.error('ORPHAN MESSAGE', messageInstance, activeCellFound)
        return false
      }
      if (activeCellFound.service_id) {
        // probably in DB non-caching context
        if (messageInstance.service_id === activeCellFound.service_id) {
          // already saved the message -- this is a duplicate message
          console.error('DUPLICATE MESSAGE', messageInstance, activeCellFound)
          return false
        }
      } else {
        // caching context need to look at message thread
        const messageThread = await query({ campaignContactId: messageInstance.campaign_contact_id })
        const redundant = messageThread.filter(
          m => (m.service_id && m.service_id === messageInstance.service_id)
        )
        if (redundant.length) {
          console.error('DUPLICATE MESSAGE', messageInstance, activeCellFound)
          return false
        }
      }
      contactData.id = (contactData.id || activeCellFound.campaign_contact_id)
      contactData.timezone_offset = (contactData.timezone_offset || activeCellFound.timezone_offset)
      contactData.message_status = (contactData.message_status || activeCellFound.message_status)
      const updateFields = ['campaign_contact_id', 'assignment_id']
      updateFields.forEach(f => {
        if (!messageInstance[f]) {
          // eslint-disable-next-line no-param-reassign
          messageInstance[f] = activeCellFound[f]
        }
      })
    }

    await Message.save(messageInstance,
                       (messageInstance.id
                        ? { conflict: 'update' }
                        : undefined
                       ))
    // eslint-disable-next-line no-param-reassign
    messageInstance.created_at = new Date()
    // console.log('hi saveMsg1', contactData, contact)
    await saveMessageCache(contactData.id, [messageInstance])
    // console.log('hi saveMsg2')
    let newStatus = 'needsResponse'
    if (!messageInstance.is_from_contact) {
      newStatus = (contactData.message_status === 'needsResponse'
                   ? 'convo' : 'messaged')
    }
    // console.log('hi saveMsg3', newStatus, contactData)
    await campaignContactCache.updateStatus(
      contactData, newStatus
    )
    // console.log('hi saveMsg4', newStatus)
    return { ...contactData, message_status: newStatus }
  }
}

export default messageCache
