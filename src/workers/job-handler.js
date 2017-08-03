import { r } from '../server/models'
import { sleep, getNextJob, updateJob } from './lib'
import { exportCampaign, uploadContacts, assignTexters, createInteractionSteps, sendMessages } from './jobs'
import { setupUserNotificationObservers } from '../server/notifications'

function jobMap() {
  return {
    export: exportCampaign,
    upload_contacts: uploadContacts,
    assign_texters: assignTexters,
    create_interaction_steps: createInteractionSteps,
    // usually dispatched in three separate processes, not here
    send_messages: sendMessages
  }
}

const JOBS_SAME_PROCESS = !!process.env.JOBS_SAME_PROCESS

(async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      if (!JOBS_SAME_PROCESS) {
        // if this is running as a 'cron-like' task to finish all jobs
        // and then close, then no need to wait around for the next
        await sleep(1000)
      }
      const job = await getNextJob()
      if (job) {
        await (jobMap()[job.job_type])(job)
        await r.table('job_request')
          .get(job.id)
          .delete()
      } else if (JOBS_SAME_PROCESS) {
        break // all finished, so just complete
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
})()
