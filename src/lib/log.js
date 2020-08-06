import minilog from "minilog";
import { isClient } from "./is-client";
const Rollbar = require("rollbar");
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
  let rollbar = null;

  if (
    process.env.NODE_ENV === "production" &&
    process.env.ROLLBAR_ACCESS_TOKEN
  ) {
    rollbar = new Rollbar({
      accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
      captureUncaught: true,
      captureUnhandledRejections: true,
      endpoint: "https://api.rollbar.com/api/1/item"
    });
  }

  minilog.suggest.deny(
    /.*/,
    process.env.NODE_ENV === "development" ? "debug" : "debug"
  );

  minilog
    .enable()
    .pipe(minilog.backends.console.formatWithStack)
    .pipe(minilog.backends.console);

  logInstance = minilog("backend");
  const existingErrorLogger = logInstance.error;
  logInstance.error = err => {
    if (rollbar) {
      if (typeof err === "object") {
        rollbar.error(err);
      } else if (typeof err === "string") {
        rollbar.log(err);
      } else {
        rollbar.log("Got backend error with no error message");
      }
    }

    existingErrorLogger(err && err.stack ? err.stack : err);
  };
}

const log = process.env.LAMBDA_DEBUG_LOG ? console : logInstance;

export { log };
