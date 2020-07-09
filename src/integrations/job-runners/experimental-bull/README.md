# EXPERIMENTAL: bull job runner

[Bull](https://github.com/OptimalBits/bull) is a mature, feature-rich job
queueing library for nodejs.

This job runner is experimental and should not be used in production yet

## Running locally

From the Spoke root directory:

1. Install bull: `yarn add bull`
2. Run redis locally
3. Add `JOB_RUNNER=experimental-bull` and `REDIS_URL` to your .env
4. Run the worker process: `dev-tools/babel-run-with-env.js src/integrations/job-runners/experimental-bull/processor.js`
5. Run the application: `yarn run dev`