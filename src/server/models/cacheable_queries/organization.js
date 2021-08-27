import {
  getMessageServiceConfig,
  tryGetFunctionFromService
} from "../../../extensions/service-vendors/service_map";
import { getConfig } from "../../api/lib/config";
import { r } from "../../models";

const cacheKey = orgId => `${process.env.CACHE_PREFIX || ""}org-${orgId}`;

const getOrganizationMessageService = organization =>
  getConfig("service", organization) ||
  getConfig("DEFAULT_SERVICE", organization);

const organizationCache = {
  clear: async id => {
    if (r.redis) {
      await r.redis.delAsync(cacheKey(id));
    }
  },
  getMessageService: getOrganizationMessageService,
  getMessageServiceConfig: async (organization, options = {}) => {
    const { restrictToOrgFeatures, obscureSensitiveInformation } = options;
    const serviceName = getOrganizationMessageService(organization);
    return getMessageServiceConfig(serviceName, organization, {
      restrictToOrgFeatures,
      obscureSensitiveInformation
    });
  },
  getMessageServiceSid: async (organization, contact, messageText) => {
    const messageServiceName = getOrganizationMessageService(organization);
    const getMessageServiceSid = tryGetFunctionFromService(
      messageServiceName,
      "getMessageServiceSid"
    );

    if (!getMessageServiceSid) {
      return null;
    }
    return getMessageServiceSid(organization, contact, messageText);
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
