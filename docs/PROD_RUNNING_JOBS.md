# Running Jobs in Production

There are two modes possible in the code base driven by an environment variable
(and what processes your setup/run) called `JOBS_SAME_PROCESS`.  If that variable
is set then dispatched jobs like processing uploaded contacts, and sending text
messages out are run on the same process as the actual web application.

There are advantages and disadvantages to each model:

## JOBS_SAME_PROCESS

 * Simpler dispatch, application runs in a single 'node' process loop
 * Can be run on 'serverless' platforms like AWS Lambda (with one lambda)
 * When in development mode the log loop of the job processor processes doesn't

## Separate Processes

 * If you are using a texting backend that rate-limits API calls (Twilio does not)
   then it's easier to make sure the rate-limit is observed with the separate process
 * On a big server-deployment job segfaults (should be impossible, but...) will more
   isolated

