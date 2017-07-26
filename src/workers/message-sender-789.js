import nexmo from '../server/api/lib/nexmo'
import twilio from '../server/api/lib/twilio'
import { r } from '../server/models'
import { log } from '../lib'
import { sleep } from './lib'

const serviceMap = { nexmo, twilio }

async function sendMessages() {
  /* knex-style approach to the below:
  const foo = await r.k.table('message')
    .where('user_number', 'LIKE', '%7')
    .where('user_number', 'LIKE', '%8')
    .where('user_number', 'LIKE', '%9')
  */
  const messages = await r.table('message')
    .getAll('QUEUED', { index: 'send_status' })
    .filter((doc) => doc('user_number').match('[789]$'))
    .group('user_number')
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
