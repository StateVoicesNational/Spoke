import Twilio from 'twilio'
import { getFormattedPhoneNumber } from '../../../lib/phone-format'
import { Message, PendingMessagePart, r } from '../../models'
import { log } from '../../../lib'
import faker from 'faker'

let twilio = null
if (process.env.TWILIO_API_KEY && process.env.TWILIO_AUTH_TOKEN) {
  twilio = Twilio(process.env.TWILIO_API_KEY, process.env.TWILIO_AUTH_TOKEN)
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
  // const firstPart = messageParts[0]
  // const userNumber = firstPart.user_number
  // const contactNumber = firstPart.contact_number
  // const serviceMessages = messageParts.map((part) => part.service_message)
  // const text = serviceMessages
  //   .map((serviceMessage) => serviceMessage.text)
  //   .join('')

  // const lastMessage = await getLastMessage({ contactNumber, userNumber })

  // return new Message({
  //   contact_number: contactNumber,
  //   user_number: userNumber,
  //   is_from_contact: true,
  //   text,
  //   service_messages: serviceMessages,
  //   service_message_ids: serviceMessages.map((doc) => doc.messageId),
  //   assignment_id: lastMessage.assignment_id,
  //   service: 'nexmo',
  //   send_status: 'DELIVERED'
  // })
}

export async function findNewCell() {
  if (!twilio || process.env.NODE_ENV === 'development') {
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

export async function twilioRentNewCell() {
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
          console.log("purchased number", purchasedNumber)
          resolve(purchasedNumber.phone_number)
        }
      })
    })
  }


  throw new Error('Did not find any cell')
}



export async function twilioSendMessage(message) {
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
    }, (err, response) => {
      if (err) {
        console.log("ERROR", err)
        reject(err)
      } else {
        console.log("SUCCESS!", response)
        const serviceMessageIds = [response.sid] // TODO: Multiple message parts?
        const messageToSave = {
          ...message
        }
        messageToSave.service_message_ids = serviceMessageIds
        messageToSave.service_messages.push(response || null)

        // TODO: This copies nexmo code nearly exactly
        const hasError = !!messageToSave.error_code
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
    })
  })
}

export async function handleTwilioDeliveryReport(report) {
  const messageSid = report.MessageSid
  if (messageSid) {
    const messageStatus = report.MessageStatus
    const message = r.table('message')
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

export async function handleTwilioIncomingMessage(message) {
  console.log("Got message", message)
  return
  // if (!message.hasOwnProperty('to') ||
  //   !message.hasOwnProperty('msisdn') ||
  //   !message.hasOwnProperty('text') ||
  //   !message.hasOwnProperty('messageId')) {
  //   log.error(`This is not an incoming message: ${JSON.stringify(message)}`)
  // }

  // const { to, msisdn, concat } = message
  // const isConcat = concat === 'true'
  // const contactNumber = getFormattedPhoneNumber(msisdn)
  // const userNumber = getFormattedPhoneNumber(to)

  // let parentId = ''
  // if (isConcat) {
  //   log.info(`Incoming message part (${message['concat-part']} of ${message['concat-total']} for ref ${message['concat-ref']}) from ${contactNumber} to ${userNumber}`)
  //   parentId = message['concat-ref']
  // } else {
  //   log.info(`Incoming message part from ${contactNumber} to ${userNumber}`)
  // }

  // const pendingMessagePart = new PendingMessagePart({
  //   service: 'nexmo',
  //   parent_id: parentId,
  //   service_message: message,
  //   user_number: userNumber,
  //   contact_number: contactNumber
  // })

  // const part = await pendingMessagePart.save()
  // return part.id
}
