import { saveJob } from "./helpers";
import { invokeJobFunction } from "../../workers/job-processes";

const JOBS_SAME_PROCESS = !!(
  process.env.JOBS_SAME_PROCESS || global.JOBS_SAME_PROCESS
);
const JOBS_SYNC = !!(process.env.JOBS_SYNC || global.JOBS_SYNC);

export const fullyConfigured = () => true;
export const dispatch = async (
  { queue_name, locks_queue, job_type, organization_id, campaign_id, payload },
  opts = {}
) => {
  const job = await saveJob(
    {
      assigned: JOBS_SAME_PROCESS,
      locks_queue,
      job_type,
      organization_id,
      campaign_id,
      queue_name,
      payload
    },
    opts.trx
  );

  if (JOBS_SAME_PROCESS) {
    if (JOBS_SYNC) {
      await invokeJobFunction(job);
    }
    // Intentionally un-awaited promise
    invokeJobFunction(job).catch(err =>
      console.log("Exception in un-awaited job", err)
    );
  }
  // default: just save the job
};
