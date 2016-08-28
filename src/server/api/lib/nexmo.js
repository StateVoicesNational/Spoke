import Nexmo from 'nexmo'
import { getFormattedPhoneNumber } from '../../../lib/phone-format'
import { Message, PendingMessagePart, r } from '../../models'
import { log } from '../../../lib'

let nexmo = null
const MAX_SEND_ATTEMPTS = 5
if (process.env.NEXMO_API_KEY && process.env.NEXMO_API_SECRET) {
  nexmo = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET
  })
}

export async function getLastMessage({ userNumber, contactNumber }) {
  const lastMessage = await r.table('message')
    .getAll(contactNumber, { index: 'contact_number' })
    .filter({
      user_number: userNumber,
      is_from_contact: false
    })
    .orderBy(r.desc('created_at'))
    .limit(1)
    .pluck('assignment_id')(0)
    .default(null)

  return lastMessage
}

export async function saveNewIncomingMessage (messageInstance) {
  await messageInstance.save()

  await r.table('campaign_contact')
    .getAll(messageInstance.assignment_id, { index: 'assignment_id' })
    .filter({ cell: messageInstance.contact_number })
    .limit(1)
    .update({ message_status: 'needsResponse' })
}

export async function convertMessagePartsToMessage(messageParts) {
  const firstPart = messageParts[0]
  const userNumber = firstPart.user_number
  const contactNumber = firstPart.contact_number
  const serviceMessages = messageParts.map((part) => part.service_message)
  const text = serviceMessages
    .map((serviceMessage) => serviceMessage.text)
    .join('')

  const lastMessage = await getLastMessage({ contactNumber, userNumber })

  return new Message({
    contact_number: contactNumber,
    user_number: userNumber,
    is_from_contact: true,
    text,
    service_messages: serviceMessages,
    service_message_ids: serviceMessages.map((doc) => doc.messageId),
    assignment_id: lastMessage.assignment_id,
    service: 'nexmo',
    send_status: 'DELIVERED'
  })
}

export async function findNewCell() {
  if (!nexmo) {
    return { numbers: [{ msisdn: '+18179994303' }] }
  }
  return new Promise((resolve, reject) => {
    nexmo.number.search('US', { features: 'VOICE,SMS', size: 1 }, (err, response) => {
      if (err) {
        reject(err)
      } else {
        resolve(response)
      }
    })
  })
}

export async function rentNewCell() {
  if (!nexmo) {
    return '+18179994303'
  }
  const newCell = await findNewCell()

  if (newCell && newCell.numbers && newCell.numbers[0] && newCell.numbers[0].msisdn) {
    return new Promise((resolve, reject) => {
      nexmo.number.buy('US', newCell.numbers[0].msisdn, (err, response) => {
        if (err) {
          reject(err)
        } else {
          // It appears we need to check error-code in the response even if response is returned.
          // This library returns responses that look like { error-code: 401, error-label: 'not authenticated'}
          // or the bizarrely-named { error-code: 200 } even in the case of success
          if (response['error-code'] !== '200') {
            reject(new Error(response['error-label']))
          } else {
            resolve(newCell.numbers[0].msisdn)
          }
        }
      })
    })
  }
  throw new Error('Did not find any cell')
}

export async function sendMessage(message) {
  if (!nexmo) {
    return 'test_message_uuid'
  }

  return new Promise((resolve, reject) => {
    // US numbers require that the + be removed when sending via nexmo
    nexmo.message.sendSms(message.user_number.replace(/^\+/, ''),
      message.contact_number,
      message.text, {
        'status-report-req': 1,
        'client-ref': message.id
      }, (err, response) => {
        const messageToSave = {
          ...message
        }
        let hasError = false
        if (err) {
          hasError = true
        }
        if (response) {
          response.messages.forEach((serviceMessages) => {
            if (serviceMessages.status !== '0') {
              hasError = true
            }
          })
        }

        messageToSave.service = 'nexmo'
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
    )
  })
}

export async function handleDeliveryReport(report) {
  if (report.hasOwnProperty('client-ref')) {
    const message = await Message.get(report['client-ref'])
    message.service_messages.push(report)
    if (report.status === 'delivered' || report.status === 'accepted') {
      message.send_status = 'DELIVERED'
    } else if (report.status === 'expired' ||
      report.status === 'failed' ||
      report.status === 'rejected') {
      message.send_status = 'ERROR'
    }
    Message.save(message, { conflict: 'update' })
  }
}

export async function handleIncomingMessage(message) {
  if (!message.hasOwnProperty('to') ||
    !message.hasOwnProperty('msisdn') ||
    !message.hasOwnProperty('text') ||
    !message.hasOwnProperty('messageId')) {
    log.error(`This is not an incoming message: ${JSON.stringify(message)}`)
  }

  const { to, msisdn, concat } = message
  const isConcat = concat === 'true'
  const contactNumber = getFormattedPhoneNumber(msisdn)
  const userNumber = getFormattedPhoneNumber(to)

  let parentId = ''
  if (isConcat) {
    log.info(`Incoming message part (${message['concat-part']} of ${message['concat-total']} for ref ${message['concat-ref']}) from ${contactNumber} to ${userNumber}`)
    parentId = message['concat-ref']
  } else {
    log.info(`Incoming message part from ${contactNumber} to ${userNumber}`)
  }

  const pendingMessagePart = new PendingMessagePart({
    service: 'nexmo',
    parent_id: parentId,
    service_message: message,
    user_number: userNumber,
    contact_number: contactNumber
  })

  const part = await pendingMessagePart.save()
  return part.id
}
