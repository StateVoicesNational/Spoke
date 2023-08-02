import { invokeJobFunction } from "../../../workers/job-processes";
import { invokeTaskFunction } from "../../../workers/tasks";
import { r } from "../../../server/models";
import {log} from '../../../lib/log'

import { jobQueue, taskQueue } from "./queues";

const taskConcurrency = process.env.BULL_TASK_CONCURRENCY ? parseInt(process.env.BULL_TASK_CONCURRENCY) : 1;

taskQueue.process('__default__', taskConcurrency, async bullJob => {
  log.debug('Processing bull task: ', {...bullJob })
  const { taskName, payload } = bullJob.data;
  await invokeTaskFunction(taskName, payload);
});

jobQueue.process(async bullJob => {
  log.debug("Processing bull job", {...bullJob })
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
