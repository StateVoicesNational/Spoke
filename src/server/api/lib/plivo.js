import plivo from 'plivo'
import { getFormattedPhoneNumber } from '../../../lib/phone-format'
import { Message, r } from '../../models'

const plivoAPI = plivo.RestAPI({
  authId: process.env.PLIVO_AUTH_ID,
  authToken: process.env.PLIVO_AUTH_TOKEN
})

export async function findNewCell(params = {}) {
  const searchParams = {
    country_iso: 'US', // The ISO code A2 of the country
    type: 'national', // The type of number you are looking for. The possible number types are local, national and tollfree.
      // 'pattern' : '210', // Represents the pattern of the number to be searched.
      // 'region' : 'Texas' // This filter is only applicable when the number_type is local. Region based filtering can be performed.
    ...params
  }

  return new Promise((resolve, reject) => {
    plivoAPI.search_phone_numbers(searchParams, function (status, response) {
      if (status !== 200) {
        reject(new Error('Could not buy number'))
      } else {
        resolve(response.objects[0].number)
      }
    })
  })
}

export async function rentNewCell(params = {}) {
  const newCell = await findNewCell(params)

  const rentParams = {
    number: newCell,
    app_id: process.env.PLIVO_APP_ID
  }

  return new Promise((resolve, reject) => {
    plivoAPI.buy_phone_number(rentParams, function (status, response) {
      if (status !== 201) {
        reject(new Error('Could not rent number'))
      } else {
        resolve(newCell)
      }
    })
  })
}


export async function sendMessage(params = {}) {
  const sendMessageParams = {
    ...params,
    url: 'http://28e140b7.ngrok.io/plivo-message-report', // The URL to which with the status of the message is sent
    method: 'POST' // The method used to call the url
  }

  return new Promise((resolve, reject) => {
    if (process.env.PLIVO_MESSAGE_SENDING_DISABLED === 'YES') {
      resolve('dummy_service_message_id')
    } else {
      plivoAPI.send_message(sendMessageParams, function (status, response) {
        if (status !== 202) {
          reject(new Error('Could not send message'))
        } else {
          resolve(response.message_uuid[0])
        }
      })
    }
  })
}

export async function handleIncomingMessage(body) {
  const { To, From, Text, MessageUUID } = body

  const contactNumber = getFormattedPhoneNumber(From)
  const userNumber = getFormattedPhoneNumber(To)

  const lastMessage = await r.table('message')
    .filter({
      contact_number: contactNumber,
      user_number: userNumber,
      is_from_contact: false
    })
    .orderBy(r.desc('created_at'))
    .limit(1)
    .pluck('assignment_id')(0)
    .default(null)

  if (lastMessage) {
    const assignmentId = lastMessage.assignment_id
    const messageInstance = new Message({
      contact_number: contactNumber,
      user_number: userNumber,
      is_from_contact: true,
      text: Text,
      assignment_id: assignmentId,
      service_message_id: MessageUUID
    })
    await messageInstance.save()

    await r.table('campaign_contact')
      .getAll(assignmentId, { index: 'assignment_id' })
      .filter({ cell: contactNumber })
      .limit(1)
      .update({ message_status: 'needsResponse' })

    return messageInstance.id
  } else {
    throw new Error('No message thread to attach incoming message to')
  }
}
