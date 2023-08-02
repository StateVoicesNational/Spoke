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

  minilog.suggest.clear();  // Clear any existing suggestions
  minilog.suggest.deny(/.*/, process.env.LOG_LEVEL || 'info');  // Deny everything below the LOG_LEVEL



  if (process.env.NODE_ENV === "production" && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    import('./gcp-logger').then(({ gcpLogger }) => {
      minilog.enable().pipe(gcpLogger);
      console.log('loaded GCP logger')
    }).catch(err => {
      console.error('Error loading GCP logger:', err);
    });
  } else {
    minilog
      .enable()
      .pipe(minilog.backends.console.formatWithStack)
      .pipe(minilog.backends.console);
  }

  logInstance = minilog("backend");
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
