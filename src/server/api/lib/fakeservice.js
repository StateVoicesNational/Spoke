import { getLastMessage } from './message-sending'
import { Message, PendingMessagePart, r } from '../../models'
import { log } from '../../../lib'

// This 'fakeservice' allows for fake-sending messages
// that end up just in the db appropriately and then using sendReply() graphql
// queries for the reception (rather than a real service)

async function sendMessage(message, contact, trx) {
  const newMessage = new Message({
    ...message,
    service: 'fakeservice',
    send_status: 'SENT',
    sent_at: new Date(),
  })

  if (message && message.id) {
    let request = r.knex('message')
    if (trx) {
      request = request.transacting(trx)
    }
    // updating message!
    await request
      .where('id', message.id)
      .update({
        service: 'fakeservice',
        send_status: 'SENT',
        sent_at: new Date()
      })
  }

  if (contact && /autorespond/.test(message.text)) {
    // We can auto-respond to the the user if they include the text 'autorespond' in their message
    await Message.save({
      ...message,
      // just flip/renew the vars for the contact
      id: undefined,
      service_id: `mockedresponse${Math.random()}`,
      is_from_contact: true,
      text: `responding to ${message.text}`,
      send_status: 'DELIVERED'
    })
    contact.message_status = 'needsResponse'
    await contact.save()
  }
  return newMessage
}

// None of the rest of this is even used for fake-service
// but *would* be used if it was actually an outside service.

async function convertMessagePartsToMessage(messageParts) {
  const firstPart = messageParts[0]
  const userNumber = firstPart.user_number
  const contactNumber = firstPart.contact_number
  const text = firstPart.service_message

  const lastMessage = await getLastMessage({
    contactNumber
  })

  const service_id = (firstPart.service_id
                      || `fakeservice_${Math.random().toString(36).replace(/[^a-zA-Z1-9]+/g, '')}`)
  return new Message({
    contact_number: contactNumber,
    user_number: userNumber,
    is_from_contact: true,
    text,
    service_response: JSON.stringify(messageParts),
    service_id,
    assignment_id: lastMessage.assignment_id,
    service: 'fakeservice',
    send_status: 'DELIVERED'
  })
}

async function handleIncomingMessage(message) {
  const { contact_number, user_number, service_id, text } = message
  const pendingMessagePart = new PendingMessagePart({
    service: 'fakeservice',
    service_id,
    parent_id: null,
    service_message: text,
    user_number,
    contact_number
  })

  const part = await pendingMessagePart.save()
  return part.id
}

export default {
  sendMessage,
  // useless unused stubs
  convertMessagePartsToMessage,
  handleIncomingMessage
}
