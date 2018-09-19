import { r } from '../../models'

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
  if (messageInstance.service_id) {
    const countResult = await r.getCount(r.knex('message').where('service_id', messageInstance.service_id))
    if (countResult) {
      console.error('DUPLICATE MESSAGE SAVED', countResult.count, messageInstance)
    }
  }
  if (!messageInstance.campaign_contact_id) {
    const lastMessage = await getLastMessage({
      contactNumber,
      service: messageInstance.service,
      messageServiceSid: messageInstance.messageservice_sid
    })
    if (lastMessage) {
      messageInstance.campaign_contact_id = lastMessage.campaign_contact_id
      messageInstance.assignment_id = (messageInstance.assignment_id
                                       || lastMessage.assignment_id)
    }
  }
  await messageInstance.save()

  await r.table('campaign_contact')
    .getAll(messageInstance.assignment_id, { index: 'assignment_id' })
    .filter({ cell: messageInstance.contact_number })
    .limit(1)
    .update({ message_status: 'needsResponse', updated_at: 'now()' })
}
