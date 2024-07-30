import moment from "moment";
import { CloudWatch } from "@aws-sdk/client-cloudwatch";
import { CloudWatchEvents } from "@aws-sdk/client-cloudwatch-events";
import { log } from "../lib";
import { getConfig } from "./api/lib/config";
import _ from "lodash";

const stage = getConfig("STAGE") || "local";
const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME || "NOT_SET";

const reportEventCallbacks = [];
const reportErrorCallbacks = [];
const expressMiddlewareCallbacks = [];
const formatRequestErrorCallbacks = [];

const TELEMETRY_IGNORED_ERROR_CODES = [
  "FORBIDDEN",
  "NOT_FOUND",
  "SUSPENDED",
  "UNAUTHORIZED",
  "CAMPAIGN_ARCHIVED",
  "CAMPAIGN_FULL",
  "DUPLICATE_REPLY_MESSAGE",
  "DUPLICATE_MESSAGE",
  "TEXTING_HOURS",
  "CAMPAIGN_CLOSED",
  "CAMPAIGN_CLOSED_FOR_INITIAL_SENDS",
  "FAILEDJOIN_TOOMANYTEXTERS"
];

const makeCloudwatchEvent = (detailType, details) => {
  return {
    Entries: [
      {
        Time: moment.utc().format(),
        Source: `spoke.${stage}`,
        Resources: [functionName],
        DetailType: detailType,
        Detail: JSON.stringify({
          stage,
          ...details
        })
      }
    ]
  };
};

const makeCloudwatchErrorEvent = (err, details) => {
  const errDetails = {
    traceback: err.stack,
    message: err.message,
    ...details
  };
  return makeCloudwatchEvent("Application Exception", errDetails);
};

// Specific to the Warren AWS deploy: report a cloudwatch event to "Mission Control"
if (getConfig("ENABLE_CLOUDWATCH_REPORTING", null, { truthy: 1 })) {
  const cloudwatchEventsClient = new CloudWatchEvents();
  const cloudwatchMetricsClient = new CloudWatch();

  reportErrorCallbacks.push(async (err, details) => {
    const payload = makeCloudwatchErrorEvent(err, details);
    try {
      await cloudwatchEventsClient.putEvents(payload);
    } catch (e) {
      log.error({
        msg: "Error posting exception to Cloudwatch:",
        error: e,
        payload
      });
    }
  });

  reportEventCallbacks.push(async (detailType, details) => {
    const payload = makeCloudwatchEvent(detailType, details);
    try {
      await cloudwatchEventsClient.putEvents(payload);
      if (details.count) {
        const metricData = {
          MetricData: [
            {
              MetricName: detailType.replace(/\W/g, ""),
              Value: details.count,
              Unit: details.unit || "Count",
              Timestamp: moment.utc().format()
            }
          ],
          Namespace: `Spoke/${stage}/Data`
        };
        await cloudwatchMetricsClient.putMetricData(metricData);
      }
    } catch (e) {
      log.error({
        msg: "Error posting event to Cloudwatch:",
        error: e,
        payload
      });
    }
    console.log("telemetry.reportEvent", detailType, details);
  });

  expressMiddlewareCallbacks.push(async (err, req) => {
    await new Promise(resolve => {
      cloudwatchEventsClient.putEvents(
        makeCloudwatchErrorEvent(err),
        awsErr => {
          log.error("Error posting exception to Cloudwatch:", awsErr);
          resolve();
        }
      );
    });
  });

  formatRequestErrorCallbacks.push(async (err, req) => {
    try {
      if (err.code) {
        if (TELEMETRY_IGNORED_ERROR_CODES.indexOf(err.code) === -1) {
          const payload = makeCloudwatchErrorEvent(err.originalError || err, {
            userId: req.user && req.user.id,
            code: err.code || "UNKNOWN",
            awsRequestId: req.awsContext
              ? req.awsContext.awsRequestId
              : undefined,
            awsEvent: req.awsEvent,
            path: JSON.stringify(err.path)
          });
          await cloudwatchEventsClient.putEvents(payload);
        }
        const metricData = {
          MetricData: [
            {
              MetricName: err.code,
              Value: 1,
              Unit: "Count",
              Timestamp: moment.utc().format()
            }
          ],
          Namespace: `Spoke/${stage}/Error`
        };
        await cloudwatchMetricsClient.putMetricData(metricData);
      }
    } catch (e) {
      log.error({
        msg: "Error posting exception to Cloudwatch:",
        error: e,
        payload
      });
    }
  });
}

// default no-ops
if (reportEventCallbacks.length === 0) {
  reportEventCallbacks.push(async (detailType, details) =>
    log.info({ msg: "TELEMETRY EVENT", detailType, details })
  );
}

if (reportErrorCallbacks.length === 0) {
  reportErrorCallbacks.push(async (err, details) =>
    log.error({ msg: "TELEMETRY ERROR", err, details })
  );
}

async function reportEvent(detailType, details) {
  await Promise.all(reportEventCallbacks.map(cb => cb(detailType, details)));
}

async function reportError(err, details) {
  await Promise.all(reportErrorCallbacks.map(cb => cb(err, details)));
}

async function formatRequestError(err, req) {
  let code = "UNKNOWN";
  if (err.originalError) {
    code = err.originalError.code || "INTERNAL_SERVER_ERROR";
  }
  err.code = code;
  await Promise.all(formatRequestErrorCallbacks.map(cb => cb(err, req)));
}

function expressMiddleware(err, req, res, next) {
  Promise.all(expressMiddlewareCallbacks.map(cb => cb(err, req, res))).then(
    () => {
      next(err);
    }
  );
}

export default {
  reportError,
  reportEvent,
  formatRequestError,
  expressMiddleware
};
