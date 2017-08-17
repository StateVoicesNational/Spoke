'use strict'
const AWS = require('aws-sdk')
const awsServerlessExpress = require('aws-serverless-express')
const app = require('./build/server/server/index')
const jobs = require('./build/server/workers/jobs')
const server = awsServerlessExpress.createServer(app.default)
exports.handler = (event, context) => {
  if (event.command) {
    const functionName = context.functionName
    if (event.command in jobs) {
      const job = jobs[event.command]
      // behavior and arguments documented here:
      // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#invoke-property
      job({'event': event,
           'dispatcher': function(dataToSend, callback) {
             const lambda = AWS.Lambda()
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
           }})
    } else {
      console.error('Unfound command sent as a Lambda event: ' + event.command)
    }
  } else {
    return awsServerlessExpress.proxy(server, event, context)
  }
}
