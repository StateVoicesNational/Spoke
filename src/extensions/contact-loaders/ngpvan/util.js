import { getConfig } from "../../../server/api/lib/config";

export const DEFAULT_NGP_VAN_API_BASE_URL = "https://api.securevan.com";

export default class Van {
  static getAuth = organization => {
    const appName = getConfig("NGP_VAN_APP_NAME", organization);
    const apiKey = getConfig("NGP_VAN_API_KEY", organization);

    if (!appName || !apiKey) {
      throw new Error(
        "Environment missing NGP_VAN_APP_NAME or NGP_VAN_API_KEY"
      );
    }

    const buffer = Buffer.from(`${appName}:${apiKey}|0`);
    return `Basic ${buffer.toString("base64")}`;
  };

  static makeUrl = (pathAndQuery, organization) => {
    const baseUrl =
      getConfig("NGP_VAN_API_BASE_URL", organization) ||
      DEFAULT_NGP_VAN_API_BASE_URL;
    return `${baseUrl}/${pathAndQuery}`;
  };
}
