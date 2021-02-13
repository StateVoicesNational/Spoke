import { r } from "../../models";
import { getConfig, hasConfig } from "../../api/lib/config";
import { symmetricDecrypt } from "../../api/lib/crypto";
import serviceMap from "../../../extensions/messaging_services/service_map";

const cacheKey = orgId => `${process.env.CACHE_PREFIX || ""}org-${orgId}`;

const getMessageServiceFromCache = organization =>
  getConfig("service", organization) || getConfig("DEFAULT_SERVICE");

const tryGetFunctionFromOrganizationMessageService = (
  organization,
  functionName
) => {
  const messageServiceName = getMessageServiceFromCache(organization);
  const messageService = serviceMap[messageServiceName];
  const fn = messageService[functionName];
  return fn && typeof fn === "function" ? fn : null;
};

const organizationCache = {
  clear: async id => {
    if (r.redis) {
      await r.redis.delAsync(cacheKey(id));
    }
  },
  getMessageService: getMessageServiceFromCache,
  getMessageServiceConfig: async organization => {
    const getConfigFromCache = tryGetFunctionFromOrganizationMessageService(
      organization,
      "getConfigFromCache"
    );
    return getConfigFromCache && (await getConfigFromCache(organization));
  },
  getMessageServiceSid: async (organization, contact, messageText) => {
    const getMessageServiceSidFromCache = tryGetFunctionFromOrganizationMessageService(
      organization,
      "getMessageServiceSidFromCache"
    );
    return (
      getMessageServiceSidFromCache &&
      (await getMessageServiceSidFromCache(organization, contact, messageText))
    );
  },
  getTwilioAuth: async organization => {
    const hasOrgToken = hasConfig("TWILIO_AUTH_TOKEN_ENCRYPTED", organization);
    // Note, allows unencrypted auth tokens to be (manually) stored in the db
    // @todo: decide if this is necessary, or if UI/envars is sufficient.
    const authToken = hasOrgToken
      ? symmetricDecrypt(getConfig("TWILIO_AUTH_TOKEN_ENCRYPTED", organization))
      : getConfig("TWILIO_AUTH_TOKEN", organization);
    const accountSid = hasConfig("TWILIO_ACCOUNT_SID", organization)
      ? getConfig("TWILIO_ACCOUNT_SID", organization)
      : // Check old TWILIO_API_KEY variable for backwards compatibility.
        getConfig("TWILIO_API_KEY", organization);
    return { authToken, accountSid };
  },
  load: async id => {
    if (r.redis) {
      const orgData = await r.redis.getAsync(cacheKey(id));
      if (orgData) {
        return JSON.parse(orgData);
      }
    }
    const [dbResult] = await r
      .knex("organization")
      .where("id", id)
      .select("*")
      .limit(1);
    if (dbResult) {
      if (dbResult.features) {
        dbResult.feature = JSON.parse(dbResult.features);
      } else {
        dbResult.feature = {};
      }
      if (r.redis) {
        await r.redis
          .multi()
          .set(cacheKey(id), JSON.stringify(dbResult))
          .expire(cacheKey(id), 43200)
          .execAsync();
      }
    }
    return dbResult;
  }
};

export default organizationCache;
