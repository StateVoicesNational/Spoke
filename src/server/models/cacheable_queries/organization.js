import { r, loaders } from "../../models";
import { getConfig } from "../../api/lib/config";

const cacheKey = orgId => `${process.env.CACHE_PREFIX || ""}org-${orgId}`;

const organizationCache = {
  clear: async id => {
    if (r.redis) {
      await r.redis.delAsync(cacheKey(id));
    }
    loaders.organization.clear(String(id));
    loaders.organization.clear(Number(id));
  },
  getMessageServiceSid: async (organization, contact, messageText) => {
    // Note organization won't always be available, so we'll need to conditionally look it up based on contact
    if (messageText && /twilioapitest/.test(messageText)) {
      return "fakeSid_MK123";
    }
    return getConfig("TWILIO_MESSAGE_SERVICE_SID", organization);
  },
  getMessageServiceAuth: async (organization, contact, messageText) => {
    // Note organization won't always be available, so we'll need to conditionally look it up based on contact
    if (messageText && /twilioapitest/.test(messageText)) {
      return {
        messagingServiceSid: "fakeSid_MK123",
        authToken: "foobar",
        apiKey: "foobarbaz"
      };
    }
    return {
      messagingServiceSid: getConfig(
        "TWILIO_MESSAGE_SERVICE_SID",
        organization
      ),
      authToken: getConfig("TWILIO_AUTH_TOKEN", organization),
      apiKey: getConfig("TWILIO_API_KEY", organization)
    };
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
