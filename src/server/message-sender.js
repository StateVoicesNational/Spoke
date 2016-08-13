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
    log.info('sending message', messages[index].reduction)
    await sendMessage(messages[index].reduction)
  }
}

(async () => {
  let shouldContinue = true
  while (shouldContinue) {
    try {
      shouldContinue = false
      await sleep(1100)
      await sendMessages()
      shouldContinue = true
    } catch (ex) {
      log.error(ex)
    }
  }
})()
