import { getAxiosWithRetries } from "./axiosWithRetries";

const webHookUrl = process.env.ZAPIER_WEBHOOK_URL;

export const canPostToZapierWebook = () => !!webHookUrl;

export const postToZapierWebook = async payload => {
  if (!webHookUrl) {
    return;
  }

  try {
    getAxiosWithRetries().post(webHookUrl, payload, {
      headers: {
        "content-type": "application/json"
      }
    });
  } catch (error) {
    console.error(`Error in postToZapierWebook ${error}`);
  }
};
