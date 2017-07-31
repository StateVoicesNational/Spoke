import nexmo from '../server/api/lib/nexmo'
import twilio from '../server/api/lib/twilio'
import { r } from '../server/models'
import { log } from '../lib'
import { sleep } from './lib'

const serviceMap = { nexmo, twilio }

async function sendMessages() {
  const messages = await r.table('message')
    .getAll('QUEUED', { index: 'send_status' })
    .filter((doc) => doc('contact_number').match('[01]$'))
    .group('contact_number')
    .orderBy('created_at')
    .limit(1)(0)
  for (let index = 0; index < messages.length; index++) {
    const message = messages[index].reduction
    const service = serviceMap[message.service]
    log.info(`Sending (${message.service}): ${message.user_number} -> ${message.contact_number}\nMessage: ${message.text}`)
    await service.sendMessage(message)
  }
}

(async () => {
  while (true) {
    try {
      await sleep(1100)
      await sendMessages()
    } catch (ex) {
      log.error(ex)
    }
  }
})()
