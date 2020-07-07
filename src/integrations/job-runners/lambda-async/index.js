import AWS from "aws-sdk";
import { saveJob } from "../helpers";

// TODO: push this functionality into lambda.js so users don't
// have to deploy two lambdas
const functionName = process.env.WORKER_LAMBDA_FUNCTION_NAME;

const client = new AWS.Lambda();

export const fullyConfigured = () => !!functionName;

export const dispatchJob = async (
  { queue_name, job_type, organization_id, campaign_id, payload },
  opts = {}
) => {
  const job = await saveJob(
    {
      // locking the queue is not supported
      // TODO: think about how that functionality should be handled
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

  await client
    .invoke({
      FunctionName: functionName,
      InvocationType: "Event",
      Payload: JSON.stringify({ type: "JOB", jobId: job.id })
    })
    .promise();
  return job;
};

export const dispatchTask = async (taskName, payload) => {
  await client
    .invoke({
      FunctionName: functionName,
      InvocationType: "Event",
      Payload: JSON.stringify({ type: "TASK", taskName, payload })
    })
    .promise();
};
