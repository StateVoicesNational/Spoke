import originalFetch from "node-fetch";
import AbortController from "node-abort-controller";
import { log } from "../../lib";
import { v4 as uuid } from "uuid";

const requestWithRetry = async (
  url,
  {
    validateStatus,
    retries = retries === 0 ? 0 : retries || 2,
    timeout = 2000,
    ...props
  } = {}
) => {
  const requestId = uuid();

  const retryDelay = () => {
    const baseDelay = 50;
    const randomDelay = Math.floor(Math.random() * (baseDelay / 2));
    return baseDelay + randomDelay;
  };

  const statusValidator = status => {
    let acceptableStatuses = [200];
    if (validateStatus) {
      if (typeof validateStatus === "function") {
        return validateStatus(status);
      } else if (Array.isArray(validateStatus)) {
        acceptableStatuses = validateStatus;
      } else {
        acceptableStatuses = [validateStatus];
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
