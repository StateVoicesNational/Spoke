import minilog from "minilog";
import stringify from 'json-stringify-safe'
import { isClient } from "./is-client";
const rollbar = require("rollbar");
let logInstance = null;

if (isClient()) {
  minilog.enable();
  logInstance = minilog("client");
  const existingErrorLogger = logInstance.error;
  logInstance.error = (...err) => {
    const errObj = err;
    if (window.Rollbar) {
      window.Rollbar.error(...errObj);
    }
    existingErrorLogger.call(...errObj);
  };
} else {
  let enableRollbar = false;
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ROLLBAR_ACCESS_TOKEN
  ) {
    enableRollbar = true;
    rollbar.init(process.env.ROLLBAR_ACCESS_TOKEN);
  }
  let enableGcpLog = process.env.GCP_LOG ? true : false;

  if (!enableGcpLog) {
    minilog.suggest.deny(
      /.*/,
      process.env.NODE_ENV === "development" ? "debug" : "debug"
    );

    minilog
      .enable()
      .pipe(minilog.backends.console.formatWithStack)
      .pipe(minilog.backends.console);

    logInstance = minilog("backend");
  } else {

    const existingLoggerFunctions = {
      ERROR: logInstance ? logInstance.error : console.error,
      INFO: logInstance ? logInstance.log : console.log,
      DEBUG: logInstance ? logInstance.debug : console.debug,
      WARNING: logInstance ? logInstance.warn : console.warn,
    };

    const LOG_LEVELS = {
      'error': 4,
      'warning': 3,
      'info': 2,
      'debug': 1
    };

    const createLogFunction = severity => (...objs) => {
      if (LOG_LEVELS[severity.toLowerCase()] < LOG_LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()]) {
        return;
      }
      if (enableGcpLog) {
        let message = '';
        const content = [];
        objs.forEach(obj => {
          if (typeof obj === "string") {
            message += obj + ' ';
          } else if (obj instanceof Error) {
            const errorObj = {};
            if (obj.message) errorObj.message = obj.message;
            if (obj.stack) errorObj.stack = obj.stack;
            if (obj.name) errorObj.name = obj.name;
            content.push(errorObj);
          } else {
            content.push(obj);
          }
        });
        const entry = {
          severity: severity,
          message: message.trim(),
          content: content
        };
        console.log(stringify(entry));
      } else {
        const logger = existingLoggerFunctions[severity];
        logger(...objs);
      }
    };


    logInstance = {
      error: createLogFunction('ERROR'),
      info: createLogFunction('INFO'),
      debug: createLogFunction('DEBUG'),
      warn: createLogFunction('WARNING'),
    };
  }

  const existingErrorLogger = logInstance.error;
  logInstance.error = (...err) => {
    if (enableRollbar) {
      err.forEach((e) => {
        if (typeof e === "object") {
          rollbar.handleError(e);
        } else if (typeof e === "string") {
          rollbar.reportMessage(e);
        } else {
          rollbar.reportMessage("Got backend error with no error message");
        }
      });
    }

    existingErrorLogger(...err);
  };
}


const log = process.env.LAMBDA_DEBUG_LOG ? console : logInstance;

export { log };