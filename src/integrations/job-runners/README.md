# Job Runners

## Intro

Spoke has several functions that need to be run in the background after
an API request has returned. Strategies for executing this background
work depend on the deployment environment. This job runner API allows
organizations to customize background jobs to their deployment without
introducing conflicts with MoveOn/main.


## Tasks vs Jobs

"Tasks" are lightweight fire-and-forget operations, while "Jobs" are
long-running operations that are tracked in the JobRequest table.

While most queueing systems should be able to handle both types of background
processing, we are keeping them separate for now to allow for different execution
strategies. For example, it might be reasonable to always run tasks in-process
outside of AWS Lambda while still pushing Jobs to a separate worker process.

Note: This api may change in the future.

## Configuration

A Spoke instance must have exactly one job runner configured via the `JOB_RUNNER`
env var. For backwards compatibility, JOB_RUNNER will default to 'legacy', which
uses the `JOBS_SAME_PROCESS` and `JOBS_SYNC` env vars.

Individual job runners may require additional configuration, for example
an SQS queue URL or Lambda function ARN.

## Implementing a Job Runner

Job Runner modules must export the following functions:
  * `fullyConfigured() -> boolean`
  * `dispatchJob(jobData) -> JobRequest`
  * `dispatchTask(taskName, payload) -> void`

Use fullyConfigured to fail-fast if your job running strategy isn't properly configured.
`dispatchTask` and `disptachJob` both enqueue units of work, but `dispatchJob` has to also
save and return a JobRequest object.

## Adding new Jobs and Tasks

Tasks are defined in `src/workers/tasks.js` and Jobs are defined
in `src/workers/job-processes.js`. To add a new task/job add its
 name to the Tasks/Jobs enum, and the function to run in the
 taskMap/jobsMap object.

_Note: when writing new jobs/tasks keep in mind that they
may execute in a separate process and design accordingly._
