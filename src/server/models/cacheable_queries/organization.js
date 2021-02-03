import { r } from "../../models";
import { getConfig, hasConfig } from "../../api/lib/config";
import { symmetricDecrypt } from "../../api/lib/crypto";

const cacheKey = orgId => `${process.env.CACHE_PREFIX || ""}org-${orgId}`;

const organizationCache = {
  clear: async id => {
    if (r.redis) {
      await r.redis.delAsync(cacheKey(id));
    }
  },
  getMessageService: organization =>
    getConfig("service", organization) || getConfig("DEFAULT_SERVICE"),
  getMessageServiceSid: async (organization, contact, messageText) => {
    // Note organization won't always be available, so we'll need to conditionally look it up based on contact
    if (messageText && /twilioapitest/.test(messageText)) {
      return "fakeSid_MK123";
    }
    const service = organizationCache.getMessageService(organization);
    if (service === "twilio") {
      return getConfig("TWILIO_MESSAGE_SERVICE_SID", organization);
    } else if (service === "signalwire") {
      return getConfig("SIGNALWIRE_MESSAGE_SERVICE_SID", organization);
    }
    return null;
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
  getSignalwireAuth: async organization => {
    const hasOrgToken = hasConfig(
      "SIGNALWIRE_AUTH_TOKEN_ENCRYPTED",
      organization
    );
    // Note, allows unencrypted auth tokens to be (manually) stored in the db
    // @todo: decide if this is necessary, or if UI/envars is sufficient.
    const authToken = hasOrgToken
      ? symmetricDecrypt(
          getConfig("SIGNALWIRE_AUTH_TOKEN_ENCRYPTED", organization)
        )
      : getConfig("SIGNALWIRE_AUTH_TOKEN", organization);
    const accountSid = hasConfig("SIGNALWIRE_ACCOUNT_SID", organization)
      ? getConfig("SIGNALWIRE_ACCOUNT_SID", organization)
      : // Check old SIGNALWIRE_API_KEY variable for backwards compatibility.
        getConfig("SIGNALWIRE_API_KEY", organization);
    const spaceUrl = getConfig("SIGNALWIRE_SPACE_URL", organization);
    return { authToken, accountSid, spaceUrl };
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
