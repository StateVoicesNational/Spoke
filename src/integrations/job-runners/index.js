// WORK IN PROGRESS: plugin-style job runners
// Motivation: strategies for running background jobs depend a lot on
// the deployment environment. Providing a job-runner API allows
// organizations using Spoke to customize background jobs to their
// deployment environment without introducing conflicts with MoveOn/main

// API:
// *  fullyConfigured() -> Boolean
// *  dispatchJob(jobData) -> job object
// *  task(taskData) -> void
//
// TODOs:
// * Figure out what to do about locks_queue. Not all runners can support it but it
//   also doesn't seem necessary.
// * Introduce better statuses and handling of job failure
// * Rather than querying job_request directly in our resolvers,
//   we should call the job runner: getJob, listOrganizationJobs, listCampaignJobs
//   This allows job runners to implement their own storage, potentially outside of
//   the database.
function getJobRunner() {
  const name = process.env.JOB_RUNNER || "legacy";
  let runner;
  try {
    // eslint-disable-next-line global-require
    runner = require(`./${name}`);
  } catch (e) {
    throw new Error(`Job runner ${name} not found`);
  }
  console.log(`Successfully loaded ${name} job runner`);
  if (!runner.fullyConfigured()) {
    throw new Error(`Job runner ${name} is not fully configured`);
  }
  return runner;
}

export const jobRunner = getJobRunner();
