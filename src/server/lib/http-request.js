import originalFetch from "isomorphic-fetch";
import originalFetchRetry from "fetch-retry";

const wrappedFetch = originalFetchRetry(originalFetch);

const requestWithRetry = async (url, props) => {
  let originalProps = props || {};
  const remainingProps = {
    ...(originalProps || {})
  };
  delete remainingProps.validateStatus;
  delete remainingProps.retries;

  const retries = originalProps.retries || 2;

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

  const response = await wrappedFetch(url, {
    retryDelay: () => {
      const baseDelay = 50;
      const randomDelay = Math.floor(Math.random() * (baseDelay / 2));
      return baseDelay + randomDelay;
    },
    retryOn: (attempt, error, resp) => {
      if (validateStatus(resp.status)) {
        return false;
      }

      if (
        attempt < retries &&
        (error !== null || (resp && resp.status >= 500 && resp.status <= 599))
      ) {
        return true;
      }

      return false;
    },
    ...remainingProps
  });

  if (!validateStatus(response.status)) {
    throw new Error(`Request failed with status code ${response.status}`);
  }

  return response;
};

export default requestWithRetry;
