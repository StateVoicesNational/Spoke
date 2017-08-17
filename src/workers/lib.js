import { r, JobRequest } from '../server/models'

export const sleep = (ms = 0) => new Promise(fn => setTimeout(fn, ms))

export async function updateJob(job, percentComplete) {
  if (job.id) {
    await JobRequest.get(job.id)
      .update({
        status: percentComplete,
        updated_at: new Date()
      })
  }
}

export async function getNextJob() {
  let nextJob = await r.table('job_request')
      .filter({'assigned': false})
      .orderBy('created_at')
      .limit(1)(0)
  if (nextJob) {
      const updateResults = await r.table('job_request')
        .get(nextJob.id)
        .update({ assigned: true })
      if (updateResults.replaced !== 1) {
        nextJob = null
      }
  }
  return nextJob
}
