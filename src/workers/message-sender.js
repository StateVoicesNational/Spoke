import { sendMessage } from '../server/api/lib/nexmo'
import { r } from '../server/models'
import { log } from '../lib'
import { sleep } from './lib'

async function sendMessages() {
  const messages = await r.table('message')
    .getAll('QUEUED', { index: 'send_status' })
    .group('user_number')
    .orderBy('created_at')
    .limit(1)(0)
  for (let index = 0; index < messages.length; index++) {
    log.info('sending message', messages[index].reduction)
    await sendMessage(messages[index].reduction)
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
