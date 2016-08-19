import { sendMessage, getLastMessage, saveNewIncomingMessage } from './api/lib/nexmo'
import { r, Message } from './models'
import { log } from '../lib'

async function sleep(ms = 0) {
  return new Promise(fn => setTimeout(fn, ms))
}

async function sendMessages() {
  const messages = await r.table('message')
    .getAll('QUEUED', { index: 'send_status' })
    .group('user_number')
    .orderBy('created_at')
    .limit(1)(0)
  for (let index = 0; index < messages.length; index++) {
    log.info('sending message', messages[index].reduction)
    await sendMessage(messages[index].reduction)
  }
}

async function handlePendingIncomingMessageParts() {
  const groupedMessageParts = await r.table('pending_message_part')
    .group('parent_id', 'user_number', 'contact_number')
    .orderBy(r.row('service_message')('concat-part'))
  for (let index = 0; index < groupedMessageParts.length; index++) {
    const [parentId, userNumber, contactNumber] = groupedMessageParts[index].group
    const parts = groupedMessageParts[index].reduction

    const firstPart = parts[0]

    const totalCount = parseInt(firstPart.service_message['concat-total'], 0)

    if (parts.length === totalCount) {
      log.info(`All ${totalCount} parts for incoming message with concat-ref ${parentId} have arrived; creating message object and deleting parts`)
      const serviceMessages = parts.map((part) => part.service_message)
      const text = serviceMessages
        .map((serviceMessage) => serviceMessage.text)
        .join('')
      const lastMessage = await getLastMessage({ contactNumber, userNumber })

      const messageInstance = new Message({
        contact_number: contactNumber,
        user_number: userNumber,
        is_from_contact: false,
        text,
        service_messages: serviceMessages,
        assignment_id: lastMessage.assignment_id,
        service: 'nexmo',
        send_status: 'DELIVERED'
      })

      await saveNewIncomingMessage(messageInstance)
      await r.table('pending_message_part')
        .getAll(parentId, { index: 'parent_id'})
        .delete()
    }
  }
}
(async () => {
  while (true) {
    try {
      await sleep(1100)
      await sendMessages()
      await handlePendingIncomingMessageParts()
    } catch (ex) {
      log.error(ex)
    }
  }
})()
