import Twilio from 'twilio'
import { getFormattedPhoneNumber } from '../../../lib/phone-format'
import { Log, Message, PendingMessagePart, r } from '../../models'
import { log } from '../../../lib'
import { getLastMessage, saveNewIncomingMessage } from './message-sending'
import faker from 'faker'

let twilio = null
const MAX_SEND_ATTEMPTS = 5
const MESSAGE_VALIDITY_PADDING_SECONDS = 30
const MAX_TWILIO_MESSAGE_VALIDITY = 14400

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
    service_id: serviceMessages[0].MessagingServiceSid,
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

const mediaExtractor = new RegExp(/\[\s*(http[^\]\s]*)\s*\]/)

function parseMessageText(message) {
  const text = message.text || ''
  const params = {
    body: text.replace(mediaExtractor, '')
  }
  // Image extraction
  const results = text.match(mediaExtractor)
  if (results) {
    params.mediaUrl = results[1]
  }
  return params
}

async function sendMessage(message, contact, trx) {
  if (!twilio) {
    log.warn('cannot actually send SMS message -- twilio is not fully configured:', message.id)
    if (message.id) {
      const options = trx ? { transaction: trx } : {}
      await Message.get(message.id)
        .update({ send_status: 'SENT', sent_at: new Date() }, options)
    }
    return 'test_message_uuid'
  }

  return new Promise((resolve, reject) => {
    if (message.service !== 'twilio') {
      log.warn('Message not marked as a twilio message', message.id)
    }

    const messageParams = Object.assign({
      to: message.contact_number,
      body: message.text,
      messagingServiceSid: process.env.TWILIO_MESSAGE_SERVICE_SID,
      statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL
    }, parseMessageText(message))

    let twilioValidityPeriod = process.env.TWILIO_MESSAGE_VALIDITY_PERIOD

    if (message.send_before) {
      // the message is valid no longer than the time between now and
      // the send_before time, less 30 seconds
      // we subtract the MESSAGE_VALIDITY_PADDING_SECONDS seconds to allow time for the message to be sent by
      // a downstream service
      const messageValidityPeriod = Math.ceil((message.send_before - Date.now())/1000) - MESSAGE_VALIDITY_PADDING_SECONDS

      if (messageValidityPeriod < 0) {
        // this is an edge case
        // it means the message arrived in this function already too late to be sent
        // pass the negative validity period to twilio, and let twilio respond with an error
      }

      if (twilioValidityPeriod) {
        twilioValidityPeriod = Math.min(twilioValidityPeriod, messageValidityPeriod, MAX_TWILIO_MESSAGE_VALIDITY)
      } else {
        twilioValidityPeriod = Math.min(messageValidityPeriod, MAX_TWILIO_MESSAGE_VALIDITY)
      }
    }

    if (twilioValidityPeriod) {
      messageParams.validityPeriod = twilioValidityPeriod
    }

    twilio.messages.create(messageParams, (err, response) => {
      const messageToSave = {
        ...message
      }
      log.info('messageToSave', messageToSave)
      let hasError = false
      if (err) {
        hasError = true
        log.error('Error sending message', err)
        console.log('Error sending message', err)
        messageToSave.service_response += JSON.stringify(err)
      }
      if (response) {
        messageToSave.service_id = response.sid
        hasError = !!response.error_code
        messageToSave.service_response += JSON.stringify(response)
      }

      if (hasError) {
        const SENT_STRING = '"status"' // will appear in responses
        if (messageToSave.service_response.split(SENT_STRING).length >= MAX_SEND_ATTEMPTS + 1) {
          messageToSave.send_status = 'ERROR'
        }
        let options = { conflict: 'update' }
        if (trx) {
          options.transaction = trx
        }
        Message.save(messageToSave, options)
        // eslint-disable-next-line no-unused-vars
        .then((_, newMessage) => {
          reject(err || (response ? new Error(JSON.stringify(response)) : new Error('Encountered unknown error')))
        })
      } else {
        let options = { conflict: 'update' }
        if (trx) {
          options.transaction = trx
        }
        Message.save({
          ...messageToSave,
          send_status: 'SENT',
          service: 'twilio',
          sent_at: new Date()
        }, options)
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
    await Log.save({ message_sid: report.MessageSid, body: JSON.stringify(report) })
    const messageStatus = report.MessageStatus
    const message = await r.table('message')
      .getAll(messageSid, { index: 'service_id' })
      .limit(1)(0)
      .default(null)
    if (message) {
      message.service_response_at = new Date()
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
  const partId = part.id
  if (process.env.JOBS_SAME_PROCESS) {
    const finalMessage = await convertMessagePartsToMessage([part])
    await saveNewIncomingMessage(finalMessage)
    await r.knex('pending_message_part').where('id', partId).delete()
  }
  return partId
}

export default {
  syncMessagePartProcessing: !!process.env.JOBS_SAME_PROCESS,
  webhook,
  convertMessagePartsToMessage,
  findNewCell,
  rentNewCell,
  sendMessage,
  handleDeliveryReport,
  handleIncomingMessage,
  parseMessageText
}
