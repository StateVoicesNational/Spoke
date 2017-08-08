import nexmo from '../server/api/lib/nexmo'
import twilio from '../server/api/lib/twilio'
import { saveNewIncomingMessage, getLastMessage } from '../server/api/lib/message-sending'
import { r } from '../server/models'
import { log } from '../lib'

const serviceDefault = 'twilio'
async function sleep(ms = 0) {
  return new Promise(fn => setTimeout(fn, ms))
}

async function handleIncomingMessageParts() {
  const serviceMap = { nexmo, twilio }
  const messageParts = await r.table('pending_message_part')
  const messagePartsByService = [
    {'group': 'nexmo',
     'reduction': messageParts.filter((m) => (m.service == 'nexmo'))
    },
    {'group': 'twilio',
     'reduction': messageParts.filter((m) => (m.service == 'twilio'))
    },
  ]
  const serviceLength = messagePartsByService.length
  for (let index = 0; index < serviceLength; index++) {
    const serviceParts = messagePartsByService[index]
    const allParts = serviceParts.reduction
    const allPartsCount = allParts.length
    if (allPartsCount == 0) {
      continue
    }
    const service = serviceMap[serviceParts.group]
    const convertMessageParts = service.convertMessagePartsToMessage
    const messagesToSave = []
    let messagePartsToDelete = []
    const concatMessageParts = {}
    for (let i = 0; i < allPartsCount; i++) {
      const part = allParts[i]
      const serviceMessageId = part.service_id
      const savedCount = await r.table('message')
        .getAll(serviceMessageId, { index: 'service_id' })
        .count()
      const lastMessage = await getLastMessage({
        contactNumber: part.contact_number,
        service: serviceDefault
      })
      const duplicateMessageToSaveExists = !!messagesToSave.find((message) => message.service_id === serviceMessageId)
      if (!lastMessage) {
        log.info('Received message part with no thread to attach to', part)
        messagePartsToDelete.push(part)
      } else if (savedCount > 0) {
        log.info(`Found already saved message matching part service message ID ${part.service_id}`)
        messagePartsToDelete.push(part)
      } else if (duplicateMessageToSaveExists) {
        log.info(`Found duplicate message to be saved matching part service message ID ${part.service_id}`)
        messagePartsToDelete.push(part)
      } else {
        const parentId = part.parent_id
        if (!parentId) {
          messagesToSave.push(await convertMessageParts([part]))
          messagePartsToDelete.push(part)
        } else {
          if (part.service !== 'nexmo') {
            throw new Error('should not have a parent ID for twilio')
          }
          const groupKey = [parentId, part.contact_number, part.user_number]
          const serviceMessage = JSON.parse(part.service_message)
          if (!concatMessageParts.hasOwnProperty(groupKey)) {
            const partCount = parseInt(serviceMessage['concat-total'], 10)
            concatMessageParts[groupKey] = Array(partCount).fill(null)
          }

          const partIndex = parseInt(serviceMessage['concat-part'], 10) - 1
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
      log.info('Saving message with service message ID', messagesToSave[i].service_id)
      await saveNewIncomingMessage(messagesToSave[i])
    }

    const messageIdsToDelete = messagePartsToDelete.map((m) => m.id)
    log.info('Deleting message parts', messageIdsToDelete)
    await r.table('pending_message_part')
      .getAll(...messageIdsToDelete)
      .delete()
  }
}
(async () => {
  // eslint-disable-next-line no-constant-condition
  // TODO: querying the db every 100 ms seems like a bad idea.
  // We should trigger handleIncomingMessageParts whenever we write to
  // pending_message_parts
  while (true) {
    try {
      await sleep(100)
      await handleIncomingMessageParts()
    } catch (ex) {
      log.error(ex)
    }
  }
})()
