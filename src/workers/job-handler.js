import { exportCampaign, uploadContacts, assignTexters, createInteractionSteps } from './jobs'

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
