import originalFetch from "node-fetch";
import AbortController from "node-abort-controller";
import { log } from "../../lib";
import { v4 as uuid } from "uuid";

const requestWithRetry = async (url, props) => {
  const originalProps = props || {};
  const remainingProps = {
    ...(originalProps || {})
  };
  delete remainingProps.validateStatus;
  delete remainingProps.retries;
  delete remainingProps.timeout;

  const requestId = uuid();
  const propsRetries = originalProps.retries;
  const retries =
    propsRetries !== null && propsRetries !== undefined ? propsRetries : 2;
  const timeout = originalProps.timeout || 2000;

  const retryDelay = () => {
    const baseDelay = 50;
    const randomDelay = Math.floor(Math.random() * (baseDelay / 2));
    return baseDelay + randomDelay;
  };

  const validateStatus = status => {
    const validateProp = originalProps.validateStatus;
    let acceptableStatuses = [200];
    if (validateProp) {
      if (typeof validateProp === "function") {
        return validateProp(status);
      } else if (Array.isArray(validateProp)) {
        acceptableStatuses = validateProp;
      } else {
        acceptableStatuses = [validateProp];
      }
    }

    return acceptableStatuses.includes(status);
  };

  const logRequest = () => {
    return JSON.stringify({ url, props });
  };

  const RetryReturnError = {
    RETURN: 1,
    RETRY: 2,
    ERROR: 3
  };
  const shouldRetryReturnOrError = (attempt, error, resp) => {
    if (validateStatus(resp && resp.status)) {
      return RetryReturnError.RETURN;
    }

    if (
      attempt < retries &&
      (error || (resp && resp.status >= 500 && resp.status <= 599))
    ) {
      let message;
      if (error) {
        let tweakedError = error;
        if (error.toString && error.toString().match(/.*AbortError.*/g)) {
          tweakedError = `timeout after ${timeout}ms`;
        }
        message = `error -- ${tweakedError}`;
      } else {
        message = `status code ${resp.status}`;
      }

      log.warn(
        `Retrying request id ${requestId}. Reason: ${message}. Details: ${logRequest()}. Retry ${attempt +
          1} of ${retries}`
      );
      return RetryReturnError.RETRY;
    }

    return RetryReturnError.ERROR;
  };

  for (let attempt = 0; attempt < retries + 1; attempt++) {
    let error;
    let response;

    const controller = new AbortController();
    const controllerTimeout = setInterval(() => {
      controller.abort();
    }, timeout);

    try {
      response = await originalFetch(url, {
        ...remainingProps,
        signal: controller.signal
      });
    } catch (caughtException) {
      error = caughtException;
    } finally {
      clearTimeout(controllerTimeout);
    }

    const retryReturnError = shouldRetryReturnOrError(attempt, error, response);

    if (retryReturnError === RetryReturnError.RETRY) {
      await setTimeout(() => {}, retryDelay());
      continue;
    } else if (retryReturnError === RetryReturnError.ERROR) {
      let message;
      if (attempt >= retries) {
        message = `Request id ${requestId} failed; all ${retries} retries exhausted`;
      } else if (response) {
        message = `Request id ${requestId} failed; received status ${response.status}`;
      } else {
        message = `Request id ${requestId} failed; no further information`;
      }
      throw new Error(message);
    }

    return response;
  }
};

export default requestWithRetry;
