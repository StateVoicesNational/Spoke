import Twilio from 'twilio'
import { getFormattedPhoneNumber } from '../../../lib/phone-format'
import { Message, PendingMessagePart, r } from '../../models'
import { log } from '../../../lib'
import { getLastMessage, saveNewIncomingMessage } from './message-sending'
import faker from 'faker'

let twilio = null
const MAX_SEND_ATTEMPTS = 5

if (process.env.TWILIO_API_KEY && process.env.TWILIO_AUTH_TOKEN) {
  // eslint-disable-next-line new-cap
  twilio = Twilio(process.env.TWILIO_API_KEY, process.env.TWILIO_AUTH_TOKEN)
} else {
  log.warn('NO TWILIO CONNECTION')
}

if (!process.env.TWILIO_MESSAGE_SERVICE_SID) {
  log.warn('Twilio will not be able to send without TWILIO_MESSAGE_SERVICE_SID set')
}

function webhook() {
  log.warn('twilio webhook call') // sky: doesn't run this
  if (twilio) {
    return Twilio.webhook()
  } else {
    log.warn('NO TWILIO WEB VALIDATION')
    return function (req, res, next) { next() }
  }
}

async function convertMessagePartsToMessage(messageParts) {
  const firstPart = messageParts[0]
  const userNumber = firstPart.user_number
  const contactNumber = firstPart.contact_number
  const serviceMessages = messageParts.map((part) => JSON.parse(part.service_message))
  const text = serviceMessages
    .map((serviceMessage) => serviceMessage.Body)
    .join('')

  const lastMessage = await getLastMessage({
    contactNumber
  })
  return new Message({
    contact_number: contactNumber,
    user_number: userNumber,
    is_from_contact: true,
    text,
    service_response: JSON.stringify(serviceMessages),
    service_id: serviceMessages[0].service_id,
    assignment_id: lastMessage.assignment_id,
    service: 'twilio',
    send_status: 'DELIVERED'
  })
}

async function findNewCell() {
  if (!twilio) {
    return { availablePhoneNumbers: [{ phone_number: '+15005550006' }] }
  }
  return new Promise((resolve, reject) => {
    twilio.availablePhoneNumbers('US').local.list({}, (err, data) => {
      if (err) {
        reject(new Error(err))
      } else {
        resolve(data)
      }
    })
  })
}

async function rentNewCell() {
  if (!twilio) {
    return getFormattedPhoneNumber(faker.phone.phoneNumber())
  }
  const newCell = await findNewCell()

  if (newCell && newCell.availablePhoneNumbers && newCell.availablePhoneNumbers[0] && newCell.availablePhoneNumbers[0].phone_number) {
    return new Promise((resolve, reject) => {
      twilio.incomingPhoneNumbers.create({
        phoneNumber: newCell.availablePhoneNumbers[0].phone_number,
        smsApplicationSid: process.env.TWILIO_APPLICATION_SID
      }, (err, purchasedNumber) => {
        if (err) {
          reject(err)
        } else {
          resolve(purchasedNumber.phone_number)
        }
      })
    })
  }


  throw new Error('Did not find any cell')
}


async function sendMessage(message) {
  if (!twilio) {
    log.warn('cannot actually send SMS message -- twilio is not fully configured:', message.id)
    if (message.id) {
      await Message.get(message.id)
        .update({ send_status: 'SENT' })
    }
    return 'test_message_uuid'
  }

  return new Promise((resolve, reject) => {
    if (message.service !== 'twilio') {
      log.warn('Message not marked as a twilio message', message.id)
    }
    twilio.messages.create({
      to: message.contact_number,
      messagingServiceSid: process.env.TWILIO_MESSAGE_SERVICE_SID,
      body: message.text,
      statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL
    }, (err, response) => {
      const messageToSave = {
        ...message
      }
      log.info('messageToSave', messageToSave)
      let hasError = false
      if (err) {
        hasError = true
        log.error(err)
        messageToSave.service_response += JSON.stringify(err)
      }
      if (response) {
        messageToSave.service_id = response.sid
        hasError = !!response.error_code
        messageToSave.service_response += JSON.stringify(response)
      }


      if (hasError) {
        const SENT_STRING = 'error_code' // will appear in responses
        if (messageToSave.service_response.split(SENT_STRING).length >= MAX_SEND_ATTEMPTS) {
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
          send_status: 'SENT',
          service: 'twilio'
        }, { conflict: 'update' })
        .then((saveError, newMessage) => {
          resolve(newMessage)
        })
      }
    })
  })
}

async function handleDeliveryReport(report) {
  const messageSid = report.MessageSid
  if (messageSid) {
    const messageStatus = report.MessageStatus
    const message = await r.table('message')
      .getAll(messageSid, { index: 'service_id' })
      .limit(1)(0)
      .default(null)

    if (message) {
      message.service_response += JSON.stringify(report)
      if (messageStatus === 'delivered') {
        message.send_status = 'DELIVERED'
      } else if (messageStatus === 'failed' ||
        messageStatus === 'undelivered') {
        message.send_status = 'ERROR'
      }
      Message.save(message, { conflict: 'update' })
    }
  }
}

async function handleIncomingMessage(message) {
  if (!message.hasOwnProperty('From') ||
    !message.hasOwnProperty('To') ||
    !message.hasOwnProperty('Body') ||
    !message.hasOwnProperty('MessageSid')) {
    log.error(`This is not an incoming message: ${JSON.stringify(message)}`)
  }

  const { From, To, MessageSid } = message
  const contactNumber = getFormattedPhoneNumber(From)
  const userNumber = (To ? getFormattedPhoneNumber(To) : '')

  const pendingMessagePart = new PendingMessagePart({
    service: 'twilio',
    service_id: MessageSid,
    parent_id: null,
    service_message: JSON.stringify(message),
    user_number: userNumber,
    contact_number: contactNumber
  })

  const part = await pendingMessagePart.save()
  if (process.env.JOBS_SAME_PROCESS) {
    convertMessagePartsToMessage([part]).then(async function(message) {
      await saveNewIncomingMessage(message)
      await part.delete()
    })
  }
  return part.id
}

export default {
  syncMessagePartProcessing: !!process.env.JOBS_SAME_PROCESS,
  webhook,
  convertMessagePartsToMessage,
  findNewCell,
  rentNewCell,
  sendMessage,
  handleDeliveryReport,
  handleIncomingMessage
}
