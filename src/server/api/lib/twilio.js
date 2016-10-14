import Twilio from 'twilio'
import { getFormattedPhoneNumber } from '../../../lib/phone-format'
import { Message, PendingMessagePart, r } from '../../models'
import { log } from '../../../lib'
import { getLastMessage } from './message-sending'
import faker from 'faker'

let twilio = null
const MAX_SEND_ATTEMPTS = 5

if (process.env.TWILIO_API_KEY && process.env.TWILIO_AUTH_TOKEN) {
  twilio = Twilio(process.env.TWILIO_API_KEY, process.env.TWILIO_AUTH_TOKEN)
}

async function convertMessagePartsToMessage(messageParts) {
  const firstPart = messageParts[0]
  const userNumber = firstPart.user_number
  const contactNumber = firstPart.contact_number
  const serviceMessages = messageParts.map((part) => part.service_message)
  const text = serviceMessages
    .map((serviceMessage) => serviceMessage.Body)
    .join('')

  const lastMessage = await getLastMessage({
    contactNumber,
    userNumber,
    service: 'twilio'
  })

  return new Message({
    contact_number: contactNumber,
    user_number: userNumber,
    is_from_contact: true,
    text,
    service_messages: serviceMessages,
    service_message_ids: serviceMessages.map((doc) => doc.MessageSid),
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
    await Message.get(message.id)
      .update({ send_status: 'SENT' })
    return 'test_message_uuid'
  }

  return new Promise((resolve, reject) => {
    if (message.service !== 'twilio') {
      reject(new Error('Message not marked as a twilio message'))
    }
    twilio.messages.create({
      to: message.contact_number,
      from: message.user_number,
      body: message.text,
      statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL
    }, (err, response) => {
      const messageToSave = {
        ...message
      }

      let hasError = false
      if (err) {
        hasError = true
        log.error(err)
      }
      if (response) {
        const serviceMessageIds = [response.sid] // TODO: Multiple message parts?
        messageToSave.service_message_ids = serviceMessageIds
        hasError = !!response.error_code
      }

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
    })
  })
}

async function handleDeliveryReport(report) {
  const messageSid = report.MessageSid
  if (messageSid) {
    const messageStatus = report.MessageStatus
    const message = await r.table('message')
      .getAll(messageSid, { index: 'service_message_ids' })
      .limit(1)(0)
      .default(null)

    if (message) {
      message.service_messages.push(report)
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

  const { From, To, Body, MessageSid } = message

  const contactNumber = getFormattedPhoneNumber(From)
  const userNumber = getFormattedPhoneNumber(To)

  const pendingMessagePart = new PendingMessagePart({
    service: 'twilio',
    parent_id: '',
    service_message: message,
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
