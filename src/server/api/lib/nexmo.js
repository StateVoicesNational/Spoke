import Nexmo from 'nexmo'
import { getFormattedPhoneNumber } from '../../../lib/phone-format'
import { Message, PendingMessagePart } from '../../models'
import { getLastMessage } from './message-sending'
import { log } from '../../../lib'
import faker from 'faker'

let nexmo = null
const MAX_SEND_ATTEMPTS = 5
if (process.env.NEXMO_API_KEY && process.env.NEXMO_API_SECRET) {
  nexmo = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET
  })
}

async function convertMessagePartsToMessage(messageParts) {
  const firstPart = messageParts[0]
  const userNumber = firstPart.user_number
  const contactNumber = firstPart.contact_number
  const serviceMessages = messageParts.map((part) => JSON.parse(part.service_message))
  const text = serviceMessages
    .map((serviceMessage) => serviceMessage.text)
    .join('')

  return new Message({
    contact_number: contactNumber,
    user_number: userNumber,
    is_from_contact: true,
    text,
    service_response: JSON.stringify(serviceMessages),
    service_id: serviceMessages[0].service_id,
    messageservice_sid: '',
    //assignment_id and campaign_contact_id will be saved later
    service: 'nexmo',
    send_status: 'DELIVERED'
  })
}

async function findNewCell() {
  if (!nexmo) {
    return { numbers: [{ msisdn: getFormattedPhoneNumber(faker.phone.phoneNumber()) }] }
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

async function rentNewCell() {
  if (!nexmo) {
    return getFormattedPhoneNumber(faker.phone.phoneNumber())
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
            reject(new Error(response['error-code-label']))
          } else {
            resolve(newCell.numbers[0].msisdn)
          }
        }
      })
    })
  }
  throw new Error('Did not find any cell')
}

async function sendMessage(message) {
  if (!nexmo) {
    await Message.get(message.id)
      .update({ send_status: 'SENT' })
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
          messageToSave.service_response += JSON.stringify(response)
        }

        messageToSave.service = 'nexmo'

        if (hasError) {
          if (messageToSave.service_messages.length >= MAX_SEND_ATTEMPTS) {
            messageToSave.send_status = 'ERROR'
          }
          Message.save(messageToSave, { conflict: 'update' })
          // eslint-disable-next-line no-unused-vars
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

async function handleDeliveryReport(report) {
  if (report.hasOwnProperty('client-ref')) {
    const message = await Message.get(report['client-ref'])
    message.service_response += JSON.stringify(report)
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

async function handleIncomingMessage(message) {
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
    service_id: message['concat-ref'] || message.messageId,
    parent_id: parentId, // do we need this anymore, now we have service_id?
    service_message: JSON.stringify(message),
    user_number: userNumber,
    contact_number: contactNumber
  })

  const part = await pendingMessagePart.save()
  return part.id
}

export default {
  convertMessagePartsToMessage,
  findNewCell,
  rentNewCell,
  sendMessage,
  handleDeliveryReport,
  handleIncomingMessage
}
