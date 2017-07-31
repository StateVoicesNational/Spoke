import nexmo from '../server/api/lib/nexmo'
import twilio from '../server/api/lib/twilio'
import { r } from '../server/models'
import { log } from '../lib'
import { sleep } from './lib'

const serviceMap = { nexmo, twilio }

async function sendMessages() {
  const messages = await r.knex('message')
    .where({'send_status': 'QUEUED'})
    .where(r.knex.raw("(contact_number LIKE '%7' OR contact_number LIKE '%8' or contact_number LIKE '%9')"))
    .orderBy('created_at')

  for (let index = 0; index < messages.length; index++) {
    const message = messages[index]
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
