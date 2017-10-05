# Deploying on AWS Lambda

The easiest way to deploy to Lambda is with Claudia.js detailed below.

## Steps you will need to do the first time

1. First make sure you are running node 6.10 (compatible with AWS Lambda)
   `nvm install 6.10; nvm use 6.10`
2. Install Claudia js: `npm install -g claudia`

## Creating an environment variables file

3. Create a file based on the template in `./deploy/lambda-env.json`, called something like `./production-env.json` locally (whatever you call it, replace the path in the commands below with it) in the form:

```
{
  "JSONVAR1": "JSONVAR1 VALUE",
  ...
}
```

(all values must be strings)

The main variables you will require set in a lambda environment beyond the regularly documented ones:

 * Do NOT set:
   * `PORT`: The whole application is called as a library, rather than running a process on a port
   * `DEV_APP_PORT`
   * `AWS_ACCESS_KEY_ID`: amazon forbids this variable -- access should be granted through the "role" for the Lambda function
   * `AWS_SECRET_ACCESS_KEY`

 * DO Set:
   * `"SUPPRESS_SEED_CALLS": "1",`: This stops trying to connecting to the database every startup point.  You will need to run the seed call once, directly to the database rather than through Lambda (or send us a PR to make it easy to do this and other jobs in Lambda :-)
   * `"JOBS_SAME_PROCESS": "1",`: This makes jobs get called semi-synchronously (as async in code, but triggered directly from the same Lambda instance as the originating web request
   * `"AWS_ACCESS_AVAILABLE": "1",`: This replaces the AWS_ key variables for S3 bucket support
   * `STATIC_BASE_URL`: You will need to upload your ASSETS_DIR to an S3 bucket (or other static file site) and then set this to something like: `"https://s3.amazonaws.com/YOUR_BUCKET_AND_PATH/"` (don't forget the trailing '/')
   * `S3_STATIC_PATH`: This will be the s3cmd upload path that corresponds to STATIC_BASE_URL.  So if `STATIC_BASE_URL=https://s3.amazon.com/spoke.example.com/static/` then `S3_STATIC_PATH=s3://spoke.example.com/static/`  You will also need a ~/.s3cfg file that has the s3 upload credentials.  See `package.json`'s postinstall script and more specifically `prod-static-upload`.
   * `"LAMBDA_DEBUG_LOG": "1",`: (ONLY FOR DEBUGGING) This will send more details of requests to the CloudWatch log. However, it will include the full request details, e.g. so do not use this in production.

## Just the first time

4. `claudia create --handler lambda.handler --deploy-proxy-api --set-env-from-json ./production-env.json <other options!>`
   We recommend running behind a VPC (this takes additional configuration within AWS), and therefore the following options are likely needed:
   `--region <region> --security-group-ids <vpc security id> --subnet-ids <vpc subnet> --role <lambda role> --use-s3-bucket <private s3 bucket for better deployment> --memory 512 --timeout 300`

NOTES:
 * You'll want a timeout that corresponds with the scheduled jobs -- this is 5 minutes which should be the same as below
 * The memory requirement can probably be lower, but that will affect the maximum contact upload file you can send in and process.

## Steps you will need to do to update code or environment variables

(if you are using nvm, make sure to run `nvm use 6.10` first)

`claudia update --use-s3-bucket ceventroller-lambda-west1 --set-env-from-json ./production-env.json`

## Setting up scheduled jobs:

```
claudia add-scheduled-event --name spoke-job-runner --schedule 'rate(5 minutes)' --event ./deploy/lambda-scheduled-event.json
```

## Migrating the database:

New migrations are added to `src/migrations/index.js`.  You can trigger migration updates with the following
command:

```
claudia test-lambda --event ./deploy/lambda-migrate-database.js
```

(Note: the migration will probably take much less than the 5 minutes or whatever your lambda timeout is,
however it will look like `test-lambda` is still running/doing something.  If you've confirmed on the
db side that the migration completed, it's safe to Ctrl-C)

## How this works

After Claudia.js does an 'npm install' essentially of your directory (which will filter out files in `.gitignore`, etc),
It runs package.json's postinstall script which does the building necessary for production.  The environment variables included
in your env-from-json file will also be set during build.


## Debugging

Lambda seems to output sparse messages without full stacks, so it's definitely harder to debug.
Generally dumping `console.log` in places that aren't working helps (a little).

There are a few 'common' errors you will see that imply specific issues:

* (ignore) `Error: Network error: fetch is not defined`: you can safely ignore this.  This stems from some client libraries being imported into the server, but the thread isn't necessary and the promise failing is ok.
* `TypeError: Cannot read property 'error' of undefined`: This appears when you have run `await func()` and `func` does not exist (typo or not imported correctly).