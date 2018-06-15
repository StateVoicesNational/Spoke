# Configuring data exports
This guide explains how Spoke manages data exports and how to configure them in your installation.

## Conceptual overview
When a user requests a data export, Spoke prepares it behind the scenes. When the data is ready, it is uploaded to an Amazon Web Services (AWS) S3 bucket. A S3 bucket is a cloud storage container. Once the exported data has been added to the bucket, Spoke sends an email notification to the user who requested the export with a link to download the data file.

To enable data exporting, you will need:
1. to configure Spoke to send emails,
2. access to an AWS account, and
3. a S3 bucket in that account.

## Alternate: Bucketeer
If you have deployed Spoke to Heroku, you can use the [Bucketeer add-on](https://elements.heroku.com/addons/bucketeer) instead of configuring your own S3 bucket. Bucketeer automatically provisions S3 storage for you, enabling you to skip the numbered steps below. The tradeoff is that Bucketeer charges you a minimum of $5/month. Depending on your [usage](https://aws.amazon.com/s3/pricing/), this may well be more than you'd pay for your own S3 bucket, especially if you're new to AWS and taking advantage of the [free tier](https://aws.amazon.com/free/).

To use Bucketeer, [skip to the end of this document](#bucketeer-setup).

### 1. Configure Spoke to send emails
If you have already configured Spoke to send emails, skip this step. Otherwise, see [this guide](EMAIL_CONFIGURATION.MD).

### 2. Create an AWS account
If you already have an AWS account, skip this step. Otherwise, see [Amazon's documentation](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/) to create an AWS account.

### 3. Sign up for S3
If you already have S3, skip this step. Otherwise, see [Amazon's documentation](https://docs.aws.amazon.com/AmazonS3/latest/gsg/SigningUpforS3.html) to sign up for S3 using your AWS account.

### 4. Create a S3 bucket
If you already have an S3 bucket, skip this step. Otherwise, see [Amazon's documentation](https://docs.aws.amazon.com/AmazonS3/latest/user-guide/create-bucket.html) to create an S3 bucket. __You don't need to enable public access to the bucket.__

### 5. Configure Spoke environment variables
In order for Spoke to connect to S3, the following environment variables must be set:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_S3_BUCKET_NAME`
  - `AWS_SECRET_ACCESS_KEY`

If you've reached this point in application setup, you've probably configured environment variables already. Here are [Heroku](https://devcenter.heroku.com/articles/config-vars#managing-config-vars) and [AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/env_variables.html) instructions. Locally, you can use a `.env` file or the like.

## Bucketeer setup
### 1. Provision the Bucketeer add-on
Use the Heroku CLI (instructions [here](https://devcenter.heroku.com/articles/bucketeer#provisioning-the-add-on)) or the Heroku dashboard. You can [migrate](https://devcenter.heroku.com/articles/bucketeer#migrating-between-plans) between plans at any time with no downtime.

### 2. Modify the default environment variables
Bucketeer creates the following environment variables upon provisioning:
  - `BUCKETEER_AWS_ACCESS_KEY_ID`
  - `BUCKETEER_AWS_SECRET_ACCESS_KEY`
  - `BUCKETEER_BUCKET_NAME`
Spoke, however, expects these names:
- `AWS_ACCESS_KEY_ID`
- `AWS_S3_BUCKET_NAME`
- `AWS_SECRET_ACCESS_KEY`
You can change the names in the [dashboard](https://devcenter.heroku.com/articles/config-vars#using-the-heroku-dashboard) or via the [CLI](https://devcenter.heroku.com/articles/config-vars#using-the-heroku-cli). `heroku config:edit` will open all environment variables in an interactive editor.
