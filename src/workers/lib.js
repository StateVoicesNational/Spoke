import { r, JobRequest } from '../server/models'

export const sleep = (ms = 0) => {
  return new Promise(fn => setTimeout(fn, ms))
}

export async function updateJob(job, percentComplete) {
  await JobRequest.get(job.id)
    .update({
      status: percentComplete,
      updated_at: new Date()
    })
}

export async function getNextJob(jobType) {
  const nextJob = await r.table('job_request')
    .getAll([jobType, false], { index: 'unassigned_job' })
    .limit(1)(0)
    .default(null)
  if (nextJob) {
    const updateResults = await r.table('job_request')
      .get(nextJob.id)
      .update({ assigned: true })
    if (updateResults.replaced !== 1) {
      return null
    }
  }
  return nextJob
}
