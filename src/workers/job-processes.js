import { r } from '../server/models'
import { sleep, getNextJob, updateJob, log } from './lib'
import { exportCampaign, uploadContacts, assignTexters, createInteractionSteps, sendMessages, handleIncomingMessageParts } from './jobs'
import { runMigrations } from '../migrations'
import { setupUserNotificationObservers } from '../server/notifications'


/* Two process models are supported in this file.
   The main in both cases is to process jobs and send/receive messages
   on separate loop(s) from the web server.
   * job processing (e.g. contact loading) shouldn't delay text message processing

   The two process models:
   * Run the 'scripts' in dev-tools/Procfile.dev
 */

const jobMap = {
  "export": exportCampaign,
  "upload_contacts": uploadContacts,
  "assign_texters": assignTexters,
  "create_interaction_steps": createInteractionSteps,
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
        await r.table('job_request')
          .get(job.id)
          .delete()
      }

      var twoMinutesAgo = new Date(new Date() - 1000 * 60 * 2)
      // delete jobs that are older than 2 minutes
      // to clear out stuck jobs
      await r.knex('job_request')
        .where({ assigned: true })
        .where('updated_at', '<', twoMinutesAgo)
        .delete()
    } catch (ex) {
      log.error(ex)
    }
  }
}

const messageSenderCreator = (subQuery, defaultStatus) => {
  return async () => {
    console.log('Running a message sender')
    setupUserNotificationObservers()
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        await sleep(1100)
        await sendMessages(subQuery, defaultStatus)
      } catch (ex) {
        log.error(ex)
      }
    }
  }
}

export const messageSender01 = messageSenderCreator(function(mQuery) {
  return mQuery.where(r.knex.raw("(contact_number LIKE '%0' OR contact_number LIKE '%1')"))
})

export const messageSender234 = messageSenderCreator(function(mQuery) {
  return mQuery.where(r.knex.raw("(contact_number LIKE '%2' OR contact_number LIKE '%3' or contact_number LIKE '%4')"))
})

export const messageSender56 = messageSenderCreator(function(mQuery) {
  return mQuery.where(r.knex.raw("(contact_number LIKE '%5' OR contact_number LIKE '%6')"))
})

export const messageSender789 = messageSenderCreator(function(mQuery) {
  return mQuery.where(r.knex.raw("(contact_number LIKE '%7' OR contact_number LIKE '%8' or contact_number LIKE '%9')"))
})

export const failedMessageSender = messageSenderCreator(function(mQuery) {
  // messages that were attempted to be sent five minutes ago in status=SENDING
  // when JOBS_SAME_PROCESS is enabled, the send attempt is done immediately.
  // However, if it's still marked SENDING, then it must have failed to go out.
  // This is dangerous to run in a scheduled event because if there is
  // any failure path that stops the status from updating, then users might keep getting
  // texts over and over
  var fiveMinutesAgo = new Date(new Date() - 1000 * 60 * 5)
  return mQuery.where('created_at', '>', fiveMinutesAgo)
}, 'SENDING')

export async function handleIncomingMessages() {
  setupUserNotificationObservers()
  console.log('Running handleIncomingMessages')
  // eslint-disable-next-line no-constant-condition
  let i = 0
  while (true) {
    try {
      const countPendingMessagePart = await r.knex('pending_message_part')
      .count('id AS total').then( total => {
        let totalCount = 0
        totalCount = total[0].total
        return totalCount
      })
      await sleep(500)
      if(countPendingMessagePart > 0) {
        await handleIncomingMessageParts()
      }
    } catch (ex) {
      log.error('error at handleIncomingMessages', ex)
    }
  }
}

export async function runDatabaseMigrations(event, dispatcher) {
  await runMigrations(event.migrationStart)
}

const processMap = {
  'processJobs': processJobs,
  'messageSender01': messageSender01,
  'messageSender234': messageSender234,
  'messageSender56': messageSender56,
  'messageSender789': messageSender789,
  'handleIncomingMessages': handleIncomingMessages
}

// if process.env.JOBS_SAME_PROCESS then we don't need to run
// the others and messageSender should just pick up the stragglers
const syncProcessMap = {
  //'failedMessageSender': failedMessageSender, //see method for danger
  'handleIncomingMessages': handleIncomingMessages
}

const JOBS_SAME_PROCESS = !!process.env.JOBS_SAME_PROCESS

export async function dispatchProcesses(event, dispatcher) {
  const toDispatch = event.processes || (JOBS_SAME_PROCESS ? syncProcessMap : processMap)
  for (let p in toDispatch) {
    if (p in processMap) {
      /// not using dispatcher, but another interesting model would be
      /// to dispatch processes to other lambda invocations
      // dispatcher({'command': p})
      console.log('process', p)
      toDispatch[p]().then()
    }
  }
}
