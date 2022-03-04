import { getConfig } from "../../../server/api/lib/config";
import { getSecret } from "../../secret-manager";

export const DEFAULT_NGP_VAN_API_BASE_URL = "https://api.securevan.com";
export const DEFAULT_NGP_VAN_DATABASE_MODE = 0;
export const DEFAULT_NGPVAN_TIMEOUT = 32000;

export default class Van {
  static getAuth = async organization => {
    let apiKey;
    const appName = getConfig("NGP_VAN_APP_NAME", organization);

    if (organization.features["NGP_VAN_API_KEY_ENC"]) {
      const dbKey = getConfig("NGP_VAN_API_KEY_ENC", organization);
      apiKey = await getSecret("ngpVanApiKey", dbKey, organization);
    } else {
      apiKey = getConfig("NGP_VAN_API_KEY", organization);
    }

    const databaseMode = getConfig("NGP_VAN_DATABASE_MODE", organization);

    if (!appName || !apiKey) {
      throw new Error(
        "Environment missing NGP_VAN_APP_NAME or NGP_VAN_API_KEY"
      );
    }

    const buffer = Buffer.from(
      `${appName}:${apiKey}|${databaseMode || DEFAULT_NGP_VAN_DATABASE_MODE}`
    );
    return `Basic ${buffer.toString("base64")}`;
  };

  static makeUrl = (pathAndQuery, organization) => {
    const baseUrl =
      getConfig("NGP_VAN_API_BASE_URL", organization) ||
      DEFAULT_NGP_VAN_API_BASE_URL;
    return `${baseUrl}/${pathAndQuery}`;
  };

  static getNgpVanTimeout = organization => {
    return getConfig("NGP_VAN_TIMEOUT", organization) || DEFAULT_NGPVAN_TIMEOUT;
  };
}
