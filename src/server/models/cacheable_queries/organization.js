import {
  getMessageServiceConfig,
  tryGetFunctionFromService
} from "../../../extensions/service-vendors/service_map";
import { convertSecret } from "../../../extensions/secret-manager";
import { getFeatures, getConfig } from "../../api/lib/config";
import { r } from "../../models";

const cacheKey = orgId => `${process.env.CACHE_PREFIX || ""}org-${orgId}`;

const getOrganizationMessageService = organization =>
  getConfig("service", organization) ||
  getConfig("DEFAULT_SERVICE", organization);

const organizationCache = {
  clear: async id => {
    if (r.redis) {
      await r.redis.DEL(cacheKey(id));
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
      const orgData = await r.redis.GET(cacheKey(id));
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
          .MULTI()
          .SET(cacheKey(id), JSON.stringify(dbResult))
          .EXPIRE(cacheKey(id), 43200)
          .exec();
      }
    }
    return dbResult;
  },
  setFeatures: async (id, newFeatures) => {
    if (!id || !newFeatures) {
      return;
    }
    const features = await r.knex.transaction(async trx => {
      const orgDb = await trx("organization")
        .where("id", id)
        .first("features");
      const features = getFeatures(orgDb);
      let changes = false;
      for (const [featureName, featureValue] of Object.entries(newFeatures)) {
        if (
          // Don't save default values that aren't already overridden.
          (features.hasOwnProperty(featureName) ||
            getConfig(featureName) !== featureValue) &&
          // Don't save Encrypted placeholder.
          featureValue !== "<Encrypted>"
        ) {
          features[featureName] = featureValue;
          // Automatically encrypt token values when needed.
          if (featureName.endsWith("_ENCRYPTED")) {
            features[featureName] = await convertSecret(
              featureName,
              orgDb,
              featureValue
            );
          }
          changes = true;
        }
      }
      // Remove feature properties that have been unset
      Object.keys(newFeatures)
        .filter(f => newFeatures[f] === "")
        .forEach(f => {
          delete features[f];
          changes = true;
        });
      if (changes) {
        const featuresString = JSON.stringify(features);
        await trx("organization")
          .where("id", id)
          .update("features", featuresString);
        if (r.redis) {
          const orgCache = await r.redis.get(cacheKey(id));
          if (orgCache) {
            const orgObj = JSON.parse(orgCache);
            orgObj.feature = features;
            orgObj.features = featuresString;
            await r.redis
              .MULTI()
              .SET(cacheKey(id), JSON.stringify(orgObj))
              .EXPIRE(cacheKey(id), 10000)
              .exec();
          }
        }
      }
      return features;
    });
    return features;
  }
};

export default organizationCache;
