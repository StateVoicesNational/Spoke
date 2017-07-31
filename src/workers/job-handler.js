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


// commenting this out, as jobs will be run
// directly triggered from the request that initiated them
// instead of a separate process

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

      await r.table('job_request')
        .filter({
          assigned: true
        })
        .filter((row) => row('updated_at')
          .lt(r.now().sub(60 * 2)))
        .delete()
    } catch (ex) {
      log.error(ex)
    }
  }
})()

