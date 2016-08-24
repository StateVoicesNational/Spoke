import { sendMessage, saveNewIncomingMessage, convertMessagePartsToMessage } from './api/lib/nexmo'
import { r } from './models'
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
  const allParts = await r.table('pending_message_part')
  const messagesToSave = []
  let messagePartsToDelete = []
  const concatMessageParts = {}

  const allPartsCount = allParts.length

  for (let i = 0; i < allPartsCount; i++) {
    const part = allParts[i]
    const existingCount = await r.table('message')
      .getAll(part.service_message.messageId, { index: 'service_message_ids' })
      .count()

    if (existingCount > 0) {
      log.info(`Found existing message matching part service message ID ${part.service_message.messageId}`)
      messagePartsToDelete.push(part)
    } else {
      if (part.parent_id === '') {
        messagesToSave.push(await convertMessagePartsToMessage([part]))
        messagePartsToDelete.push(part)
      } else {
        const parentId = part['concat-ref']
        const groupKey = [parentId, part.contact_number, part.user_number]

        if (!concatMessageParts.hasOwnProperty(groupKey)){
          const partCount = parseInt(part.service_message['concat-total'], 0)
          concatMessageParts[groupKey] = Array(partCount).fill(null)
        }

        const partIndex = parseInt(part.service_message['concat-part'], 0) - 1
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
      const message = await convertMessagePartsToMessage(messageParts)
      messagesToSave.push(message)
    } else {
      log.debug("Not all message parts for ${groupKey} have arrived")
    }
  }

  const messageCount = messagesToSave.length
  for (let i = 0; i < messageCount; i++) {
    log.info("Saving message", messagesToSave[i])
    await saveNewIncomingMessage(messagesToSave[i])
  }

  const messagePartsToDeleteCount = messagePartsToDelete.length
  for (let i = 0; i < messagePartsToDeleteCount; i++) {
    log.info("Deleting message part", messagePartsToDelete[i])
    await r.table('pending_message_part')
      .get(messagePartsToDelete[i].id)
      .delete()
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
