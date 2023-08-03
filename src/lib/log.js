import minilog from "minilog";
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
        const messages = objs.map(obj => {
          if (obj instanceof Error) {
            return obj.stack || obj.message;
          } else {
            return obj;
          }
        });
        const entry = {
          severity: severity,
          message: messages
        };
        console.log(JSON.stringify(entry));
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
  logInstance.error = err => {
    if (enableRollbar) {
      if (typeof err === "object") {
        rollbar.handleError(err);
      } else if (typeof err === "string") {
        rollbar.reportMessage(err);
      } else {
        rollbar.reportMessage("Got backend error with no error message");
      }
    }

    existingErrorLogger(err && err.stack ? err.stack : err);
  };
}


const log = process.env.LAMBDA_DEBUG_LOG ? console : logInstance;

export { log };