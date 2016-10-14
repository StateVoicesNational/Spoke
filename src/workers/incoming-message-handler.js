import { convertNexmoMessagePartsToMessage } from '../server/api/lib/nexmo'
import { convertTwilioMessagePartsToMessage } from '../server/api/lib/twilio'
import { saveNewIncomingMessage, getLastMessage } from '../server/api/lib/message-sending'
import { r } from '../server/models'
import { log } from '../lib'

async function sleep(ms = 0) {
  return new Promise(fn => setTimeout(fn, ms))
}

const getMessageId = (part) => {
  let messageId
  if (part.service === 'nexmo') {
    messageId = part.service_message.messageId
  } else if (part.service === 'twilio') {
    messageId = part.service_message.MessageSid
  }
  return messageId
}

async function handleIncomingMessageParts(service) {
  const convertMessageParts = service === 'nexmo' ? convertNexmoMessagePartsToMessage : convertTwilioMessagePartsToMessage
  const allParts = await r.table('pending_message_part')
    .getAll(service, { index: 'service' })
  const messagesToSave = []
  let messagePartsToDelete = []
  const concatMessageParts = {}

  const allPartsCount = allParts.length

  for (let i = 0; i < allPartsCount; i++) {
    const part = allParts[i]

    const serviceMessageId = getMessageId(part)
    const savedCount = await r.table('message')
      .getAll(serviceMessageId, { index: 'service_message_ids' })
      .count()

    const lastMessage = await getLastMessage({
      userNumber: part.user_number,
      contactNumber: part.contact_number,
      service
    })

    const duplicateMessageToSaveExists = !!messagesToSave.find((message) => message.service_message_ids.indexOf(serviceMessageId) !== -1 )
    if (!lastMessage) {
      log.info('Received message part with no thread to attach to', part)
      messagePartsToDelete.push(part)
    } else if (savedCount > 0) {
      log.info(`Found already saved message matching part service message ID ${getMessageId(part)}`)
      messagePartsToDelete.push(part)
    } else if (duplicateMessageToSaveExists) {
      log.info(`Found duplicate message to be saved matching part service message ID ${getMessageId(part)}`)
      messagePartsToDelete.push(part)
    } else {
      const parentId = part.parent_id
      if (parentId === '') {
        messagesToSave.push(await convertMessageParts([part]))
        messagePartsToDelete.push(part)
      } else {
        if (part.service !== 'nexmo') {
          throw new Error('should not have a parent ID for twilio')
        }
        const groupKey = [parentId, part.contact_number, part.user_number]

        if (!concatMessageParts.hasOwnProperty(groupKey)){
          const partCount = parseInt(part.service_message['concat-total'], 10)
          concatMessageParts[groupKey] = Array(partCount).fill(null)
        }

        const partIndex = parseInt(part.service_message['concat-part'], 10) - 1
        if (concatMessageParts[groupKey][partIndex] !== null) {
          messagePartsToDelete.push(part)
        } else {
          concatMessageParts[groupKey][partIndex] = part
        }
      }
    }
  }

  const keys = Object.keys(concatMessageParts)
  const keyCount = keys.length

  for (let i = 0; i < keyCount; i++) {
    const groupKey = keys[i]
    const messageParts = concatMessageParts[groupKey]

    if (messageParts.filter((part) => part === null).length === 0) {
      messagePartsToDelete = messagePartsToDelete.concat(messageParts)
      const message = await convertMessageParts(messageParts)
      messagesToSave.push(message)
    }
  }

  const messageCount = messagesToSave.length
  for (let i = 0; i < messageCount; i++) {
    log.info("Saving message with service message IDs", messagesToSave[i].service_message_ids)
    await saveNewIncomingMessage(messagesToSave[i])
  }

  const messagePartsToDeleteCount = messagePartsToDelete.length
  for (let i = 0; i < messagePartsToDeleteCount; i++) {
    log.info("Deleting message part", messagePartsToDelete[i].id)
    await r.table('pending_message_part')
      .get(messagePartsToDelete[i].id)
      .delete()
  }
}
(async () => {
  while (true) {
    try {
      await sleep(100)
      await handleIncomingMessageParts('twilio')
      await handleIncomingMessageParts('nexmo')
    } catch (ex) {
      log.error(ex)
    }
  }
})()
