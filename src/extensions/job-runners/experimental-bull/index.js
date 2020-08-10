import { saveJob } from "../helpers";
import { taskQueue, jobQueue } from "./queues";

export const fullyConfigured = () => !!process.env.REDIS_URL;

export const dispatchJob = async (
  { queue_name, job_type, organization_id, campaign_id, payload },
  opts = {}
) => {
  const job = await saveJob(
    {
      locks_queue: false,
      assigned: true,
      organization_id,
      campaign_id,
      queue_name,
      payload,
      job_type
    },
    opts.trx
  );
  await jobQueue.add({ jobId: job.id });
  return job;
};

export const dispatchTask = async (taskName, payload) => {
  await taskQueue.add({ taskName, payload });
};
