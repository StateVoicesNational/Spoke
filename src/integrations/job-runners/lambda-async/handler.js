import { invokeJobFunction } from "../../../workers/job-processes";
import { invokeTaskFunction } from "../../../workers/tasks";
import { r } from "../../../server/models";

const requireKeys = (event, keys) => {
  for (const key of keys) {
    if (!event[key]) {
      throw new Error(`Missing key '${key}' in event ${event}`);
    }
  }
};

const handleJob = async event => {
  requireKeys(event, ["jobId"]);
  try {
    const job = await r
      .knex("job_request")
      .select("*")
      .where("id", event.jobId)
      .first();
    if (!job) {
      console.error(`Job ${event.jobId} not found`);
      return;
    }
    console.log("Running job", job);
    await invokeJobFunction(job);
  } catch (e) {
    // For now suppress Lambda retries by not raising the exception.
    // In the future, we may want to mark jobs as retryable and let Lambda do
    // its thing with exceptions.
    console.error("Caught exception while processing job", e);
  }
};

const handleTask = async event => {
  requireKeys(event, ["taskName", "payload"]);
  const { taskName, payload } = event;
  console.log("Running task", taskName, payload);
  try {
    await invokeTaskFunction(taskName, payload);
  } catch (e) {
    // For now suppress Lambda retries by not raising the exception.
    // In the future, we may want to mark jobs as retryable and let Lambda do
    // its thing with exceptions.
    console.error("Caught exception while processing task", e);
  }
};

exports.handler = async (event, context) => {
  console.log("Received event ", event);
  requireKeys(event, ["type"]);

  if (event.type === "JOB") {
    await handleJob(event);
  } else if (event.type === "TASK") {
    await handleTask(event);
  } else {
    throw new Error(`Unknown event type: ${event.type}`);
  }
};
