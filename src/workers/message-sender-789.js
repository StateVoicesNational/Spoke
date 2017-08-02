import { r } from '../server/models'
import { log } from '../lib'
import { sleep } from './lib'
import { sendMessages } from './jobs'

async function sendMyMessages() {
  return sendMessages(function(mQuery) {
    return mQuery.where(r.knex.raw("(contact_number LIKE '%7' OR contact_number LIKE '%8' or contact_number LIKE '%9')"))
  })
}

(async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await sleep(1100)
      await sendMyMessages()
    } catch (ex) {
      log.error(ex)
    }
  }
})()
