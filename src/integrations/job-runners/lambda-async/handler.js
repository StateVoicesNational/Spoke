import { invokeJobFunction } from "../../../workers/job-processes";
import { r } from "../../../server/models";

exports.handler = async (event, context) => {
  console.log("Received event ", event);
  if (!event.jobId) {
    console.error("Missing jobId in event", event);
  }

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
