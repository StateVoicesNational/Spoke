import { r } from '../server/models'
import { sleep, getNextJob, log } from './lib'
import { exportCampaign,
         processSqsMessages,
         uploadContacts,
         loadContactsFromDataWarehouse,
         loadContactsFromDataWarehouseFragment,
         assignTexters,
         sendMessages,
         handleIncomingMessageParts,
         clearOldJobs } from './jobs'
import { runMigrations } from '../migrations'
import { setupUserNotificationObservers } from '../server/notifications'

export { seedZipCodes } from '../server/seeds/seed-zip-codes'

/* Two process models are supported in this file.
   The main in both cases is to process jobs and send/receive messages
   on separate loop(s) from the web server.
   * job processing (e.g. contact loading) shouldn't delay text message processing

   The two process models:
   * Run the 'scripts' in dev-tools/Procfile.dev
 */

const jobMap = {
  'export': exportCampaign,
  'upload_contacts': uploadContacts,
  'upload_contacts_sql': loadContactsFromDataWarehouse,
  'assign_texters': assignTexters
}

export async function processJobs() {
  setupUserNotificationObservers()
  console.log('Running processJobs')
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await sleep(1000)
      const job = await getNextJob()
      if (job) {
        await (jobMap[job.job_type])(job)
      }

      const twoMinutesAgo = new Date(new Date() - 1000 * 60 * 2)
      // clear out stuck jobs
      await clearOldJobs(twoMinutesAgo)
    } catch (ex) {
      log.error(ex)
    }
  }
}

export async function checkMessageQueue() {
  if (!process.env.TWILIO_SQS_QUEUE_URL) {
    return
  }

  console.log('checking if messages are in message queue')
  while (true) {
    try {
      await sleep(10000)
      processSqsMessages()
    } catch (ex) {
      log.error(ex)
    }
  }
}

const messageSenderCreator = (subQuery, defaultStatus) => {
  return async (event) => {
    console.log('Running a message sender')
    setupUserNotificationObservers()
    let delay = 1100
    if (event && event.delay) {
      delay = parseInt(event.delay, 10)
    }
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        await sleep(delay)
        await sendMessages(subQuery, defaultStatus)
      } catch (ex) {
        log.error(ex)
      }
    }
  }
}

export const messageSender01 = messageSenderCreator(function (mQuery) {
  return mQuery.where(r.knex.raw("(contact_number LIKE '%0' OR contact_number LIKE '%1')"))
})

export const messageSender234 = messageSenderCreator(function (mQuery) {
  return mQuery.where(r.knex.raw("(contact_number LIKE '%2' OR contact_number LIKE '%3' or contact_number LIKE '%4')"))
})

export const messageSender56 = messageSenderCreator(function (mQuery) {
  return mQuery.where(r.knex.raw("(contact_number LIKE '%5' OR contact_number LIKE '%6')"))
})

export const messageSender789 = messageSenderCreator(function (mQuery) {
  return mQuery.where(r.knex.raw("(contact_number LIKE '%7' OR contact_number LIKE '%8' or contact_number LIKE '%9')"))
})

export const failedMessageSender = messageSenderCreator(function (mQuery) {
  // messages that were attempted to be sent five minutes ago in status=SENDING
  // when JOBS_SAME_PROCESS is enabled, the send attempt is done immediately.
  // However, if it's still marked SENDING, then it must have failed to go out.
  // This is dangerous to run in a scheduled event because if there is
  // any failure path that stops the status from updating, then users might keep getting
  // texts over and over
  const fiveMinutesAgo = new Date(new Date() - 1000 * 60 * 5)
  return mQuery.where('created_at', '>', fiveMinutesAgo)
}, 'SENDING')

export const failedDayMessageSender = messageSenderCreator(function (mQuery) {
  // messages that were attempted to be sent five minutes ago in status=SENDING
  // when JOBS_SAME_PROCESS is enabled, the send attempt is done immediately.
  // However, if it's still marked SENDING, then it must have failed to go out.
  // This is dangerous to run in a scheduled event because if there is
  // any failure path that stops the status from updating, then users might keep getting
  // texts over and over
  const oneDayAgo = new Date(new Date() - 1000 * 60 * 60 * 24)
  return mQuery.where('created_at', '>', oneDayAgo)
}, 'SENDING')

export async function handleIncomingMessages() {
  setupUserNotificationObservers()
  if (process.env.DEBUG_INCOMING_MESSAGES) {
    console.log('Running handleIncomingMessages')
  }
  // eslint-disable-next-line no-constant-condition
  let i = 0
  while (true) {
    try {
      if (process.env.DEBUG_SCALING) {
        console.log('entering handleIncomingMessages. round: ', ++i)
      }
      const countPendingMessagePart = await r.knex('pending_message_part')
      .count('id AS total').then(total => {
        let totalCount = 0
        totalCount = total[0].total
        return totalCount
      })
      if (process.env.DEBUG_SCALING) {
        console.log('counting handleIncomingMessages. count: ', countPendingMessagePart)
      }
      await sleep(500)
      if (countPendingMessagePart > 0) {
        if (process.env.DEBUG_SCALING) {
          console.log('running handleIncomingMessages')
        }
        await handleIncomingMessageParts()
      }
    } catch (ex) {
      log.error('error at handleIncomingMessages', ex)
    }
  }
}

export async function runDatabaseMigrations(event, dispatcher, eventCallback) {
  await runMigrations(event.migrationStart)
  if (eventCallback) {
    eventCallback(null, 'completed migrations')
  }
}

export async function loadContactsFromDataWarehouseFragmentJob(event, dispatcher, eventCallback) {
  const eventAsJob = event
  console.log('LAMBDA INVOCATION job-processes', event)
  try {
    const rv = await loadContactsFromDataWarehouseFragment(eventAsJob)
    if (eventCallback) {
      eventCallback(null, rv)
    }
  } catch(err) {
    if (eventCallback) {
      eventCallback(err, null)
    }
  }
}

const processMap = {
  processJobs,
  messageSender01,
  messageSender234,
  messageSender56,
  messageSender789,
  handleIncomingMessages
}

// if process.env.JOBS_SAME_PROCESS then we don't need to run
// the others and messageSender should just pick up the stragglers
const syncProcessMap = {
  // 'failedMessageSender': failedMessageSender, //see method for danger
  handleIncomingMessages,
  checkMessageQueue,
  clearOldJobs
}

const JOBS_SAME_PROCESS = !!process.env.JOBS_SAME_PROCESS

export async function dispatchProcesses(event, dispatcher, eventCallback) {
  const toDispatch = event.processes || (JOBS_SAME_PROCESS ? syncProcessMap : processMap)
  for (let p in toDispatch) {
    if (p in processMap) {
      // / not using dispatcher, but another interesting model would be
      // / to dispatch processes to other lambda invocations
      // dispatcher({'command': p})
      console.log('process', p)
      toDispatch[p]().then()
    }
  }
}
