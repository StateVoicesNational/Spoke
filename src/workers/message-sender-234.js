import { r } from '../server/models'
import { log } from '../lib'
import { sleep } from './lib'
import { sendMessages } from './jobs'

async function sendMyMessages() {
  return sendMessages(function(mQuery) {
    return mQuery.where(r.knex.raw("(contact_number LIKE '%2' OR contact_number LIKE '%3' or contact_number LIKE '%4')"))
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
