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

export async function getNextJob() {
  const lockedQueues = await r.table('job_request')
   .group('queue_name')
   .filter({
     assigned: true,
     locks_queue: true
   })
   .count()
   .ungroup()
   .filter((row) => row('reduction').gt(0))
   .pluck('group')('group')

  let availableQueues = await r.table('job_request')
    .filter((row) => r.not(r.expr(lockedQueues).contains(row('queue_name'))))('queue_name')
  availableQueues = availableQueues.sort()
  const nextQueue = availableQueues[0]
  let nextJob = null
  if (nextQueue) {
    nextJob = await r.table('job_request')
      .filter({ queue_name: nextQueue})
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
  }
  return nextJob
}
