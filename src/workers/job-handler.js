import { r } from '../server/models'
import { sleep, getNextJob, updateJob } from './lib'
import { exportCampaign, uploadContacts, assignTexters, createInteractionSteps } from './jobs'
import { setupUserNotificationObservers } from '../server/notifications'

function jobMap() {
  return {
    export: exportCampaign,
    upload_contacts: uploadContacts,
    assign_texters: assignTexters,
    create_interaction_steps: createInteractionSteps
  }
}


(async () => {
  while (true) {
    try {
      await sleep(1000)
      const job = await getNextJob()
      if (job) {
        await (jobMap()[job.job_type])(job)
        await r.table('job_request')
          .get(job.id)
          .delete()
      } else if (process.env.SYNC_JOBS) {
        break
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
