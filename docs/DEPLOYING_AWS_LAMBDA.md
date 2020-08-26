Below configuration about all the services necessary to deploy on AWS are outlined. There is an
[experimental CloudFront deploy script maintained by the community as an alternative](https://github.com/bchrobot/terraform-aws-spoke).

# Table Contents

1. [AWS Resource Configuration](#aws-resource-configuration)
   1. [Certificate](#certificate)
   2. [S3](#s3)
   3. [VPC](#vpc)
   4. [RDS](#rds)
2. [Deploy with Claudia.js](#deploy-with-claudiajs)
   1. [Preparation](#preparation)
      1. [Configure Deploy Environment](#configure-deploy-environment)
      2. [Create Production Environment File](#create-production-environment-file)
   2. [Deploy](#deploy)
      1. [Seed Database](#seed-database)
      2. [Setting Up Scheduled Jobs](#setting-up-scheduled-jobs)
      3. [Migrating the Database](#migrating-the-database)
      4. [Add a Custom Domain](#add-a-custom-domain)
   3. [Updating Code or Environment Variables](#updating-code-or-environment-variables)

# AWS Resource Configuration

Walking through all the different AWS resources and configuration that must be in place before deploying Spoke.

## Certificate

Spoke needs a domain to run on. In order to configure the API Gateway with this domain we first need to create a certificate.

Waiting for verification for a certificate may take a while so we will start that now. Go to the Certificate Manager service. Request a certificate. Select "public." Add a domain name `spoke.campaign.com`. Choose a validation method (generally the DNS method). Add the verification DNS records to your domain. Wait for the DNS update to propogate and continue with the setup.

## S3

Create a private S3 bucket by choosing all the default values as you go throuh the setup wizard. We will call this `textforcampaign`.

## VPC

We will create a VPC with two groups of subnets, one publicly accessible one for the RDS instance and one private one for our AWS Lambda function (don't worry, the API Gateway created later will expose the function via the domain you created a certificate for). Each group will have two subnets for redundancy.

Getting the VPC right is pretty tricky. Start by launching the VPC creation wizard and choosing "VPC with a Single Public Subnet". Give the VPC a name, `TextForCampaign`, and change the name of the subnet to `Public - 1`. Click create.

### Subnets

One subnet was already created for us. Take a note of the availability region this was created in. Now create a second public subnet in a different availability region with IPv4 CIDR `10.0.1.0/24`.

Create the two private subnets with CIDR blocks `10.0.2.0/24` and `10.0.3.0/24`. It is important that the private subnets are in different availability regions from each other, but they do not need to be different from the public subnets.

### NAT Gateway

A NAT Gateway is required to allow the private AWS Lambda function to talk to the outside world (Twilio, Mailgun, etc.).

Create a NAT Gateway in one of the two **public** subnets. Create a new Elastic IP address to use with it using the provided button.

### Route Tables

You should have two route tables for your Spoke VPC at this point. Give the name `Spoke - Private` the one marked Main and `Spoke - Public` to the other one.

Double check that `Spoke - Public`'s routes are configured to use the internet gateway created with the VPC:

```
| Destination | Target            |
|-------------|-------------------|
| 10.0.0.0/16 | local             |
| 0.0.0.0/0   | igw-xxxxxxxxxxxxx |
```

Then, edit `Spoke - Private`'s routes to connect to the NAT you just created:

```
| Destination | Target            |
|-------------|-------------------|
| 10.0.0.0/16 | local             |
| 0.0.0.0/0   | nat-xxxxxxxxxxxxx |
```

### Security Groups

Security groups give you fine grained access control for resources.

Create a security group called `Spoke - Lambda` and description `Security group for Lambda function access`. Copy the security group ID `sg-xxxxx` of this new group. Edit the inbound rules to allow web access:

```
| Type        | Protocol | Port Range | Source   | Description           |
|-------------|----------|------------|----------|-----------------------|
| HTTP (80)   | TCP (6)  | 80         | sg-xxxxx | Web traffic           |
| HTTPS (443) | TCP (6)  | 443        | sg-xxxxx | Encrypted web traffic |
```

Create another security group called `Spoke - RDS` and description `Security group for RDS access`. Edit the inbound rules to allow web access:

```
| Type              | Protocol | Port Range | Source    | Description           |
|-------------------|----------|------------|-----------|-----------------------|
| PostgreSQL (5432) | TCP (6)  | 5432       | 0.0.0.0/0 | Allow all DB access   |
```

## RDS

We will use the AWS RDS service for our Postgres database.

### Subnet Group

Create a subnet group called `spoke_rds_group`. Choose the `TextForCampaign` VPC. Add our two public subnets to the group.

### Postgres

Create an RDS instance running Postgres 10.4 with the following settings:

| Config name        | Config value         |
| ------------------ | -------------------- |
| Nickname           | `spoke_prod`         |
| Database name      | `spoke_prod`         |
| Username           | `spoke`              |
| Password           | `[something secret]` |
| Publically exposed | yes                  |

# Deploy with Claudia.js

[Claudia](https://www.claudiajs.com) is command line tool for serverless Node.js applications on AWS.

## Preparation

### Configure Deploy Environment

1. First make sure you are running node 10.x (compatible with AWS Lambda) `nvm install 10; nvm use`
2. Install Claudia js: `npm install -g claudia`
3. Create an admin user on AWS selecting programmatic access. Add that profile to `~/.aws/credentials` giving it a nickname to use later in shell commands:
   ```
   [your_profile_nickname]
   aws_access_key_id = XXXXXXXXXXXXXXXXXXX
   aws_secret_access_key = XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
4. Configure [s3cmd](https://github.com/s3tools/s3cmd)
   1. Create an AWS user called `spoke_upload`. Create a new group for it with the `AmazonS3FullAccess` policy
   2. Copy the credentials of the `spoke_upload` user to `~/.s3cfg`:
      ```
      [default]
      access_key = XXXXXXXXXXXXXXXXXX
      secret_key = XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
      ```
      > _TODO_: figure out how to switch away from default profile in `package.json`'s `prod-static-upload` script using ENV vars
   3. [Install s3cmd](https://s3tools.org/download)

### Create Production Environment File

Create a file based on the template in `./deploy/lambda-env.json`, called something like `./production-env.json` locally (whatever you call it, replace the path in the commands below with it) in the form:

```
{
  "JSONVAR1": "JSONVAR1 VALUE",
  ...
}
```

(all values must be strings)

The main variables you will require set in a lambda environment beyond the regularly documented ones:

Do **NOT** set:

- `PORT`: The whole application is called as a library, rather than running a process on a port
- `DEV_APP_PORT`
- `AWS_ACCESS_KEY_ID`: amazon forbids this variable -- access should be granted through the "role" for the Lambda function
- `AWS_SECRET_ACCESS_KEY`

**DO** Set:

- `"SUPPRESS_SEED_CALLS": "1",`: This stops Spoke from trying to connect to the database every startup point. You will need to run the seed call once, directly to the database rather than through Lambda (or send us a PR to make it easy to do this and other jobs in Lambda :-)
- `"JOBS_SAME_PROCESS": "1",`: This makes jobs get called semi-synchronously (as async in code, but triggered directly from the same Lambda instance as the originating web request
- `"JOB_RUNNER": "lambda-async",`: This dispatches asynchronous tasks that occur after a web response to another Lambda invocation which improves performance and completion.
- `"AWS_ACCESS_AVAILABLE": "1",`: This replaces the AWS\_ key variables for S3 bucket support
- `STATIC_BASE_URL`: You will need to upload your ASSETS_DIR to an S3 bucket (or other static file site) and then set this to something like: `"https://s3.amazonaws.com/YOUR_BUCKET_AND_PATH/"` (don't forget the trailing '/')
- `S3_STATIC_PATH`: This will be the s3cmd upload path that corresponds to STATIC_BASE_URL. So if `STATIC_BASE_URL=https://s3.amazon.com/spoke.example.com/static/` then `S3_STATIC_PATH=s3://spoke.example.com/static/` You will also need a ~/.s3cfg file that has the s3 upload credentials. See `package.json`'s postinstall script and more specifically `prod-static-upload`.
- `"LAMBDA_DEBUG_LOG": "1",`: (ONLY FOR DEBUGGING) This will send more details of requests to the CloudWatch log. However, it will include the full request details, e.g. so do not use this in production.

For large production environments, it might also be a good idea to add `"SUPPRESS_MIGRATIONS": "1"` so that any time you update the schema with a version upgrade,
you can manually run the migration (see below) rather than it accidentally trigger on multiple lambdas at once.

#### Environment variable maximum: 4K

AWS Lambda has a maximum size limit for all environment variable data of 4K -- this should generally be harmless.
However, some environment variables like GOOGLE_SECRET for script import can be quite large. In this case, create
another file (does not have to be located in your Spoke project directory) in the same format as production-env.json
with GOOGLE_SECRET as a top-level JSON key (currently, no other variables are supported from this file).

Then set the variable in production-env.json CONFIG_FILE: "/absolute/path/to/configfile.json" -- during deployment (below),
this file will be copied into the lambda function zip file and get deployed with the rest of the code.

## Deploy

To create the AWS Lambda function and the API Gateway to access it, run the following being sure to substitute in the correct values:

```sh
$ AWS_PROFILE=[your_profile_nickname] claudia create --handler lambda.handler \
    --deploy-proxy-api \
    --set-env-from-json ./production-env.json \
    --region [YOUR_DESIRED_REGION] \
    --security-group-ids [SPOKE_LAMBDA_SECURITY_GROUP_ID] \
    --subnet-ids [PRIVATE_SUBNET_1_ID],[PRIVATE_SUBNET_2_ID] \
    --role SpokeOnLambda \
    --use-s3-bucket [YOUR_S3_BUCKET] \
    --memory 512 --timeout 300
```

**Notes**:

- You'll want a timeout that corresponds with the scheduled jobs -- this is 5 minutes which should be the same as below
- The memory requirement can probably be lower, but that will affect the maximum contact upload file you can send in and process.

After Claudia.js does an 'npm install' essentially of your directory (which will filter out files in .gitignore, etc), It runs `package.json`'s `postinstall` script which does the building necessary for production. The environment variables included in your env-from-json file will also be set during build.

### Seed Database

Because seed calls are supressed, you will need to seed the database manually. The current best way to do this is to run Spoke locally using the RDS database credentials. In your `.env` file the relevant lines will look like:

```
DB_HOST=spokeprod.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=spoke_prod
DB_USER=spoke
DB_PASSWORD=[something secret]
DB_TYPE=pg
DB_USE_SSL=true
PGSSLMODE=require
```

### Setting Up Scheduled Jobs

```sh
$ AWS_PROFILE=[your_profile_nickname] claudia add-scheduled-event \
    --name spoke-job-runner \
    --schedule 'rate(5 minutes)' \
    --event ./deploy/lambda-scheduled-event.json
```

### Migrating the Database

Migrations are created with knex[https://knexjs.org/#Migrations].

You can trigger migration updates with the following command:

```sh
$ AWS_PROFILE=[your_profile_nickname] claudia test-lambda --event ./deploy/lambda-migrate-database.js
```

(Note: the migration will probably take much less than the 5 minutes or whatever your lambda timeout is, however it will look like `test-lambda` is still running/doing something. If you've confirmed on the DB side that the migration completed, it's safe to `Ctrl + c`)

For major database changes on large database instances, you should
probably disable the web interface so that web requests triggering
database calls are not made. In AWS, the easiest way to do this is:

1. In the API Gateway Custom Domains (see below) section, add an
   invalid prefix (like `/xxx`) to the domain.
2. Then in the Lambda AWS Console, you can disable any CloudWatch event triggers

### Add a Custom Domain

Once Claudia has created an API Gateway we can add a subdomain to access Spoke. Add the custom domain you created the certificate for, selecting that certificate. Add a mapping with a blank path and `spoke`:`latest` for the destination and path.

## Updating Code or Environment Variables

(if you are using nvm, make sure to run `nvm use` first to use the correct node version)

```sh
$ AWS_PROFILE=[your_profile_nickname] claudia update \
    --use-s3-bucket [YOUR_S3_BUCKET] \
    --set-env-from-json ./production-env.json
```
