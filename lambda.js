'use strict'
const AWS = require('aws-sdk')
const awsServerlessExpress = require('aws-serverless-express')
const app = require('./build/server/server/index')
const server = awsServerlessExpress.createServer(app.default)
const jobs = require('./build/server/workers/job-processes')

// NOTE: the downside of loading above is environment variables are initially loaded immediately,
//       so changing them means that the code must test environment variable inline (rather than use a const set on-load)
// We should NOT load app and server inside the handler, or all connection pools and state are re-instantiated per-request:
// See: http://docs.aws.amazon.com/lambda/latest/dg/best-practices.html#function-code
// "Separate the Lambda handler (entry point) from your core logic"

exports.handler = (event, context, handleCallback) => {
  // Note: When lambda is called with invoke() we MUST call handleCallback with a success
  // or Lambda will re-run/re-try the invocation twice:
  // https://docs.aws.amazon.com/lambda/latest/dg/retries-on-errors.html
  if (process.env.LAMBDA_DEBUG_LOG) {
    console.log('LAMBDA EVENT', event)
  }
  if (!event.command) {
    // default web server stuff
    const startTime = (context.getRemainingTimeInMillis ? context.getRemainingTimeInMillis() : 0)
    const webResponse = awsServerlessExpress.proxy(server, event, context)
    if (process.env.DEBUG_SCALING) {
      const endTime = (context.getRemainingTimeInMillis ? context.getRemainingTimeInMillis() : 0)
      if ((endTime - startTime) > 3000) { //3 seconds
        console.log('SLOW_RESPONSE milliseconds:', endTime-startTime, event)
      }
    }

    return handleCallback(null, webResponse)
  } else {
    // handle a custom command sent as an event
    const functionName = context.functionName
    if (event.env) {
      for (var a in event.env) {
        process.env[a] = event.env[a]
      }
    }
    console.log('Running ' + event.command)
    if (event.command in jobs) {
      const job = jobs[event.command]
      // behavior and arguments documented here:
      // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#invoke-property
      job(event,
          function dispatcher(dataToSend, callback) {
            const lambda = new AWS.Lambda()
            return lambda.invoke({
              FunctionName: functionName,
              InvocationType: "Event", //asynchronous
              Payload: JSON.stringify(dataToSend)
            }, function(err, dataReceived) {
              if (err) {
                console.error('Failed to invoke Lambda job: ', err)
              }
              if (callback) {
                callback(err, dataReceived)
              }
            })
          },
          handleCallback)
    } else if (event.command !== 'ping') {
      console.error('Unfound command sent as a Lambda event: ' + event.command)
      handleCallback(null, null)
    }
  }
}
