import { sendMessage } from './api/lib/nexmo'
import { r, Message } from './models'

async function sleep(ms = 0) {
  return new Promise(fn => setTimeout(fn, ms))
}

async function sendMessages() {
  const messages = await r.table('message')
    .getAll('', { index: 'service_message_id' })
    .group('user_number')
    .orderBy('created_at')
    .limit(1)(0)
  for (let index = 0; index < messages.length; index++) {
    await sendMessage(messages[0].reduction)
  }
}

(async () => {
  while (true) {
    await sendMessages()
    await sleep(1000)
  }
})()
