import { r, cacheableData } from '../../models'

export async function getLastMessage({ contactNumber, service, messageServiceSid }) {
  let query = r.knex('message')
    .select('assignment_id', 'campaign_contact_id')
    .where({
      is_from_contact: false,
      service
    })
  if (messageServiceSid) {
    query = query.where(function() {
      // Allow null for active campaigns immediately after post-migration
      // where messageservice_sid may not have been set yet
      return this.where('messageservice_sid', messageServiceSid)
        .orWhereNull('messageservice_sid')
    })
  }
  const [lastMessage] = await query
    .orderBy('created_at', 'desc')
    .limit(1)

  return lastMessage
}

export async function saveNewIncomingMessage(messageInstance) {
  await cacheableData.message.save({ messageInstance })
}
