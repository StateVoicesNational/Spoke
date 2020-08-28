import originalFetch from "node-fetch";
import AbortController from "node-abort-controller";
import { log } from "../../lib";
import { v4 as uuid } from "uuid";

// An HTTP client that supports timeout, retries and flexible status validation
//
// Parameters
// url: the url you want to hit
// options:
//   * All options supported by node-fetch
//   * statusValidationFunction: a function that takes one parameter (HTTP result code)
//     and returns true of that result code indicates success, false otherwise
//   * validStatuses: an array of integers that should be considered successful HTTP
//     result codees.  Will be ignored if statusValidationFunction is also provided
//   * retries: number of times to retry failed attempts, defaults to 0
//   * timeout: millisconds
const requestWithRetry = async (
  url,
  {
    validStatuses,
    statusValidationFunction,
    retries: retriesInput,
    timeout = 2000,
    ...props
  } = {}
) => {
  const retries = retriesInput || 0;
  const requestId = uuid();

  const retryDelay = () => {
    const baseDelay = 50;
    const randomDelay = Math.floor(Math.random() * (baseDelay / 2));
    return baseDelay + randomDelay;
  };

  const statusValidator = status => {
    let acceptableStatuses = [200];

    if (statusValidationFunction) {
      return statusValidationFunction(status);
    } else if (validStatuses) {
      acceptableStatuses = validStatuses;
    }

    return acceptableStatuses.includes(status);
  };

  const logRequest = () => {
    const logProps = {
      ...props
    };
    if (props && props.headers && props.headers.Authorization) {
      logProps.headers.Authorization = "redacted";
    }

    return JSON.stringify({ url, logProps });
  };

  const RetryReturnError = {
    RETURN: 1,
    RETRY: 2,
    ERROR: 3
  };
  const shouldRetryReturnOrError = (attempt, error, resp) => {
    if (statusValidator(resp && resp.status)) {
      return [RetryReturnError.RETURN];
    }

    let message = resp ? `received status ${resp.status}` : "";
    if (error || (resp && resp.status >= 500 && resp.status <= 599)) {
      if (error) {
        let tweakedError = error;
        if (error.toString && error.toString().match(/.*AbortError.*/g)) {
          tweakedError = new Error(`timeout after ${timeout}ms`);
        }
        message = `${tweakedError.message}`;
      }

      log.warn(
        `Request id ${requestId} failed. Reason: ${message}. Details: ${logRequest()}. Attempt ${attempt +
          1} of ${retries + 1}`
      );

      if (attempt < retries) {
        return [RetryReturnError.RETRY];
      }
    }

    return [RetryReturnError.ERROR, message];
  };

  for (let attempt = 0; attempt < retries + 1; attempt++) {
    let error;
    let response;

    const controller = new AbortController();
    const controllerTimeout = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      response = await originalFetch(url, {
        ...props,
        signal: controller.signal
      });
    } catch (caughtException) {
      error = caughtException;
    } finally {
      clearTimeout(controllerTimeout);
    }

    let [retryReturnError, message] = shouldRetryReturnOrError(
      attempt,
      error,
      response
    );

    if (retryReturnError === RetryReturnError.RETRY) {
      await setTimeout(() => {}, retryDelay());
      continue;
    } else if (retryReturnError === RetryReturnError.ERROR) {
      if (attempt >= retries && retries > 0) {
        message = `Request id ${requestId} failed; all ${retries} retries exhausted`;
      } else if (message) {
        message = `Request id ${requestId} failed; ${message}`;
      } else {
        message = `Request id ${requestId} failed; no further information`;
      }
      throw new Error(message);
    }

    return response;
  }
};

export default requestWithRetry;
