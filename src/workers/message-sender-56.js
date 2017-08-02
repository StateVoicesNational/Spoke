import { r } from '../server/models'
import { log } from '../lib'
import { sleep } from './lib'
import { sendMessages } from './jobs'

async function sendMyMessages() {
  return sendMessages(function(mQuery) {
    return mQuery.where(r.knex.raw("(contact_number LIKE '%5' OR contact_number LIKE '%6')"))
  })
}

(async () => {
  while (true) {
    try {
      await sleep(1100)
      await sendMyMessages()
    } catch (ex) {
      log.error(ex)
    }
  }
})()
