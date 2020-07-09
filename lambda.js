"use strict";
const AWS = require("aws-sdk");
const awsServerlessExpress = require("aws-serverless-express");
let app, server, jobs, dispatcher;

let invocationContext = {};
let invocationEvent = {};

try {
  app = require("./build/server/server/index");
  server = awsServerlessExpress.createServer(app.default);
  jobs = require("./build/server/workers/job-processes");
  dispatcher = require("./build/server/integrations/job-runners/lambda-async/handler");

  app.default.set("awsContextGetter", function(req, res) {
    return [invocationEvent, invocationContext];
  });
} catch (err) {
  if (!global.TEST_ENVIRONMENT) {
    console.error(`Unable to load built server: ${err}`);
  }
  /*
  app = require("./src/server/index");
  server = awsServerlessExpress.createServer(app.default);
  jobs = require("./src/workers/job-processes");
  */
}

// NOTE: the downside of loading above is environment variables are initially loaded immediately,
//       so changing them means that the code must test environment variable inline (rather than use a const set on-load)
// We should NOT load app and server inside the handler, or all connection pools and state are re-instantiated per-request:
// See: http://docs.aws.amazon.com/lambda/latest/dg/best-practices.html#function-code
// "Separate the Lambda handler (entry point) from your core logic"

function cleanHeaders(event) {
  // X-Twilio-Body can contain unicode and disallowed chars by aws-serverless-express like "'"
  // We don't need it anyway
  if (event.headers) {
    delete event.headers["X-Twilio-Body"];
  }
  if (event.multiValueHeaders) {
    delete event.multiValueHeaders["X-Twilio-Body"];
  }
}

exports.handler = async (event, context) => {
  // Note: When lambda is called with invoke() we MUST return with success
  // or Lambda will re-run/re-try the invocation twice:
  // https://docs.aws.amazon.com/lambda/latest/dg/retries-on-errors.html

  if (process.env.LAMBDA_DEBUG_LOG) {
    console.log("LAMBDA EVENT", event);
  }
  if (
    event.type &&
    (event.type === "JOB" || event.type === "TASK") &&
    dispatcher
  ) {
    return await dispatcher.handler(event, context);
  }
  if (!event.command) {
    // default web server stuff
    const startTime = context.getRemainingTimeInMillis
      ? context.getRemainingTimeInMillis()
      : 0;
    invocationEvent = event;
    invocationContext = context;
    cleanHeaders(event);
    const webResponse = awsServerlessExpress.proxy(
      server,
      event,
      context,
      "PROMISE"
    ).promise;
    if (process.env.DEBUG_SCALING) {
      const endTime = context.getRemainingTimeInMillis
        ? context.getRemainingTimeInMillis()
        : 0;
      if (endTime - startTime > 3000) {
        //3 seconds
        console.log("SLOW_RESPONSE milliseconds:", endTime - startTime, event);
      }
    }

    return webResponse;
  } else {
    // handle a custom command sent as an event
    const functionName = context.functionName;
    if (event.env) {
      for (var a in event.env) {
        process.env[a] = event.env[a];
      }
    }
    console.log("Running " + event.command);
    if (event.command in jobs) {
      const job = jobs[event.command];
      // behavior and arguments documented here:
      // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#invoke-property
      const result = await job(event, function dispatcher(
        dataToSend,
        callback
      ) {
        const lambda = new AWS.Lambda();
        return lambda.invoke(
          {
            FunctionName: functionName,
            InvocationType: "Event", //asynchronous
            Payload: JSON.stringify(dataToSend)
          },
          function(err, dataReceived) {
            if (err) {
              console.error("Failed to invoke Lambda job: ", err);
            }
            if (callback) {
              callback(err, dataReceived);
            }
          }
        );
      });
      return result;
    } else {
      console.error("Unfound command sent as a Lambda event: " + event.command);
    }
  }
};
