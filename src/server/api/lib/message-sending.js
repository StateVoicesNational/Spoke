import { Message, PendingMessagePart, r } from '../../models'


const MAX_SEND_ATTEMPTS = 5

async function saveSentMessage(message, service, response, serviceMessageIds, hasError) {
  const messageToSave = {
    ...message
  }

  messageToSave.service = service
  messageToSave.service_messages.push(response || null)


  if (hasError) {
    if (messageToSave.service_messages.length >= MAX_SEND_ATTEMPTS) {
      messageToSave.send_status = 'ERROR'
    }
    Message.save(messageToSave, { conflict: 'update' })
    .then((_, newMessage) => {
      reject(err || (response ? new Error(JSON.stringify(response)) : new Error('Encountered unknown error')))
    })
  } else {
    Message.save({
      ...messageToSave,
      send_status: 'SENT'
    }, { conflict: 'update' })
    .then((saveError, newMessage) => {
      resolve(newMessage)
    })
  }

}