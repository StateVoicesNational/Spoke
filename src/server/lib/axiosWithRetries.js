import axios from "axios";
import axiosRetry, { isRetryableError } from "axios-retry";

let axiosWithRetries;

export const getAxiosWithRetries = () => {
  if (!axiosWithRetries) {
    axiosWithRetries = axios.create();
    const axiosRetryConfig = {
      retries: 2,
      shouldResetTimeout: true,
      retryDelay() {
        const baseDelay = 50;
        const randomDelay = Math.floor(Math.random() * (baseDelay / 2));
        return baseDelay + randomDelay;
      },
      retryCondition: isRetryableError
    };
    axiosRetry(axiosWithRetries, axiosRetryConfig);
  }

  return axiosWithRetries;
};
