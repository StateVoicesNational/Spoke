# Deploying on AWS Lambda

The easiest way to deploy to Lambda is with Claudia.js detailed below.

## Steps you will need to do the first time

1. First make sure you are running node 6.10 (compatible with AWS Lambda)
   `nvm install 6.10; nvm use 6.10`
2. Install Claudia js: `npm install -g claudia`

## Steps you will need to do to update code

You might not need to run this -- in theory, `postinstall` in package.json triggers this

3. `OUTPUT_DIR=./build npm run prod-build-server`
4. `NODE_ENV=production ASSETS_DIR=./build/client/assets ASSETS_MAP_FILE=assets.json npm run prod-build-client`

## Creating an environment variables file

Create a file called something like `./production-json-env.json` locally (whatever you call it, replace the path in the commands below with it) in the form:

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
   * `S3_STATIC_PATH`: This will be the s3cmd upload path that corresponds to STATIC_BASE_URL.  So if `STATIC_BASE_URL=https://s3.amazon.com/spoke.example.com/static/` then `S3_STATIC_PATH=s3://spoke.example.com/static/`

## Just the first time

5. `claudia create --handler lambda.handler --deploy-proxy-api --set-env-from-json ./production-json-env.json <other options!>`
   We recommend running behind a VPC (this takes additional configuration within AWS), and therefore the following options are likely needed:
   `--region <region> --security-group-ids <vpc security id> --subnet-ids <vpc subnet> --role <lambda role> --use-s3-bucket <private s3 bucket for better deployment> --memory 512 --timeout 60`

## Steps you will need to do to update code or environment variables

(Load in production environment variables first )

claudia update --use-s3-bucket ceventroller-lambda-west1 --set-env-from-json ./production-json-env.json

