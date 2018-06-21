import { r } from '../../models'

export async function getLastMessage({ contactNumber, service }) {
  const lastMessage = await r.table('message')
    .getAll(contactNumber, { index: 'contact_number' })
    .filter({
      is_from_contact: false,
      service
    })
    .orderBy(r.desc('created_at'))
    .limit(1)
    .pluck('assignment_id')(0)
    .default(null)

  return lastMessage
}

export async function saveNewIncomingMessage(messageInstance) {
  if (messageInstance.service_id) {
    const countResult = await r.getCount(r.knex('message').where('service_id', messageInstance.service_id))
    if (countResult) {
      console.error('DUPLICATE MESSAGE SAVED', countResult.count, messageInstance)
    }
  }

  // Handle MMS
  const mediaUrls = []
  const serviceResponses = JSON.parse(messageInstance.service_response)
  serviceResponses.forEach(response => {
    const mediaUrlKeys = Object.keys(response).filter(key => key.startsWith('MediaUrl'))
    mediaUrlKeys.forEach(key => mediaUrls.push(response[key]))
  })
  if (mediaUrls.length > 0) {
    const warningText = 'This message contains multimedia attachments. Open the following attachments AT YOUR OWN RISK.'
    const mediaText = mediaUrls.unshift(warningText).join('\n\n')

    if (messageInstance.text === '') {
      messageInstance.text = mediaText
    } else {
      messageInstance.text = `${messageInstance.text}\n\n${mediaText}`
    }
  }

  await messageInstance.save()

  await r.table('campaign_contact')
    .getAll(messageInstance.assignment_id, { index: 'assignment_id' })
    .filter({ cell: messageInstance.contact_number })
    .limit(1)
    .update({ message_status: 'needsResponse', updated_at: 'now()' })
}
