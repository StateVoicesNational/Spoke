import Queue from "bull";

// Simple job and task queues. Note that bull gives us the option to
// create separate queues for each job and task type, which would allow
// finer control over concurrent processing, locking, and retries.
export const jobQueue = new Queue("jobs", process.env.REDIS_JOBS_URL, process.env.BULL_JOB_OPTS ? process.env.BULL_JOB_OPTS : {});
export const taskQueue = new Queue("tasks", process.env.REDIS_JOBS_URL, process.env.BULL_TASK_OPTS ? process.env.BULL_TASK_OPTS : {})
