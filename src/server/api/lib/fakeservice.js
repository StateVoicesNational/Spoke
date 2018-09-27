import { getLastMessage, saveNewIncomingMessage } from './message-sending'
import { Message, PendingMessagePart, r } from '../../models'
import { log } from '../../../lib'

// This 'fakeservice' allows for fake-sending messages
// that end up just in the db appropriately and then using sendReply() graphql
// queries for the reception (rather than a real service)

async function sendMessage(message, contact) {
  let newMessage;
  try {
    newMessage = await Message.save({
        ...message,
      send_status: 'SENT',
      service: 'fakeservice',
      sent_at: new Date()
    }, { conflict: 'update' })
  } catch(err) {
    console.error('FAILED MESSAGE SAVE', err, message)
  }

  if (contact && /autorespond/.test(message.text)) {
    // We can auto-respond to the the user if they include the text 'autorespond' in their message
    await saveNewIncomingMessage({
      ...message,
      // just flip/renew the vars for the contact
      service_id: `mockedresponse${Math.random()}`,
      is_from_contact: true,
      text: `responding to ${message.text}`,
      send_status: 'DELIVERED'
    }, contact)
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

  const service_id = (firstPart.service_id
                      || `fakeservice_${Math.random().toString(36).replace(/[^a-zA-Z1-9]+/g, '')}`)
  return new Message({
    contact_number: contactNumber,
    user_number: userNumber,
    is_from_contact: true,
    text,
    service_response: JSON.stringify(messageParts),
    service_id,
    //assignment_id and campaign_contact_id will be saved later
    messageservice_sid: '',
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

  if (process.env.JOBS_SAME_PROCESS) {
    const finalMessage = await convertMessagePartsToMessage([part])
    await saveNewIncomingMessage(finalMessage)
  } else {
    const part = await pendingMessagePart.save()
  }
}

export default {
  sendMessage,
  // useless unused stubs
  convertMessagePartsToMessage,
  handleIncomingMessage
}
