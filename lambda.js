'use strict'
const AWS = require('aws-sdk')
const awsServerlessExpress = require('aws-serverless-express')

// NOTE we lazy-load the modules, so that we can possibly add environment variables that affect the load earlier

exports.handler = (event, context) => {
  if (process.env.LAMBDA_DEBUG_LOG) {
    console.log('LAMBDA EVENT', event)
  }
  if (!event.command) {
    // default web server stuff
    const app = require('./build/server/server/index')
    const server = awsServerlessExpress.createServer(app.default)
    const startTime = (context.getRemainingTimeInMillis ? context.getRemainingTimeInMillis() : 0)
    const webResponse = awsServerlessExpress.proxy(server, event, context)
    if (process.env.DEBUG_SCALING) {
      const endTime = (context.getRemainingTimeInMillis ? context.getRemainingTimeInMillis() : 0)
      if ((endTime - startTime) > 3000) { //3 seconds
        console.log('SLOW_RESPONSE milliseconds:', endTime-startTime, event)
      }
    }

    return webResponse
  } else {
    // handle a custom command sent as an event
    const functionName = context.functionName
    if (event.env) {
      for (var a in event.env) {
        process.env[a] = event.env[a]
      }
    }
    const jobs = require('./build/server/workers/job-processes')
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
          })
    } else {
      console.error('Unfound command sent as a Lambda event: ' + event.command)
    }
  }
}
