import { sendMessage } from './api/lib/nexmo'
import { r } from './models'
import { log } from '../lib'

async function sleep(ms = 0) {
  return new Promise(fn => setTimeout(fn, ms))
}

async function sendMessages() {
  const messages = await r.table('message')
    .getAll('QUEUED', { index: 'send_status' })
    .group('user_number')
    .orderBy('created_at')
    .limit(1)(0)
  for (let index = 0; index < messages.length; index++) {
    await sendMessage(messages[0].reduction)
  }
}

(async () => {
  while (true) {
    try {
      await sleep(2500)
      await sendMessages()
    } catch (ex) {
      log.error(ex)
    }
  }
})()
