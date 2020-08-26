import { invokeJobFunction } from "../../../workers/job-processes";
import { invokeTaskFunction } from "../../../workers/tasks";
import { r } from "../../../server/models";

import { jobQueue, taskQueue } from "./queues";

taskQueue.process(async bullJob => {
  console.debug("Processing bull job:", { ...bullJob, queue: null });
  const { taskName, payload } = bullJob.data;
  await invokeTaskFunction(taskName, payload);
});

jobQueue.process(async bullJob => {
  console.debug("Processing bull job:", { ...bullJob, queue: null });
  const { jobId } = bullJob.data;
  const job = await r
    .knex("job_request")
    .select("*")
    .where("id", jobId)
    .first();
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  await invokeJobFunction(job);
});
