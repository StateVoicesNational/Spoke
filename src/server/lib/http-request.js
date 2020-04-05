import originalFetch from "node-fetch";
import originalFetchRetry from "fetch-retry";
import AbortController from "node-abort-controller";

const wrappedFetch = originalFetchRetry(originalFetch);

const requestWithRetry = async (url, props) => {
  let originalProps = props || {};
  const remainingProps = {
    ...(originalProps || {})
  };
  delete remainingProps.validateStatus;
  delete remainingProps.retries;
  delete remainingProps.timeout;

  const retries = originalProps.retries || 2;
  const timeout = originalProps.timeout || 2000;

  let controller = new AbortController();
  let controllerTimeout = setInterval(() => {
    console.log("TIMEOUT");
    controller.abort();
  }, timeout);

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

  try {
    const response = await wrappedFetch(url, {
      retryDelay: () => {
        const baseDelay = 50;
        const randomDelay = Math.floor(Math.random() * (baseDelay / 2));
        return baseDelay + randomDelay;
      },
      retryOn: (attempt, error, resp) => {
        if (validateStatus(resp && resp.status)) {
          return false;
        }

        if (
          attempt < retries + 1 &&
          (error !== null || (resp && resp.status >= 500 && resp.status <= 599))
        ) {
          console.log("error", error);
          return true;
        }

        return false;
      },
      ...remainingProps,
      signal: controller.signal
    });

    if (!validateStatus(response.status)) {
      throw new Error(`Request failed with status code ${response.status}`);
    }

    return response;
  } catch (error) {
    throw new Error(`Request failed with error ${error}`);
  } finally {
    clearTimeout(controllerTimeout);
  }
};

export default requestWithRetry;
