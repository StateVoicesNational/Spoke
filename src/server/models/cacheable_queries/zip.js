import { getConfig } from "../../api/lib/config";
import { r } from "..";
import SmartyStreetsSDK from "smartystreets-javascript-sdk";

// SmartyStreets
const SmartyStreetsCore = SmartyStreetsSDK.core;
const Lookup = SmartyStreetsSDK.usZipcode.Lookup;

const clientBuilder = new SmartyStreetsCore.ClientBuilder(
  new SmartyStreetsCore.StaticCredentials(
    getConfig("SMARTY_AUTH_ID"),
    getConfig("SMARTY_AUTH_TOKEN")
  )
);
const client = clientBuilder.buildUsZipcodeClient();

// Cache
const cacheKey = zip => `${process.env.CACHE_PREFIX || ""}state-of-${zip}`;

const zipStateCache = {
  clearQuery: async ({ zip }) => {
    if (r.redis) {
      await r.redis.delAsync(cacheKey(zip));
    }
  },
  query: async ({ zip }) => {
    async function getState() {
      const lookup = new Lookup();

      lookup.zipCode = zip;

      const res = await client.send(lookup);
      const lookupRes = res.lookups[0].result[0];

      if (lookupRes.valid) {
        return lookupRes.zipcodes[0].stateAbbreviation;
      } else {
        throw new Error(`State not found for zip code ${zip}`);
      }
    }

    if (r.redis) {
      const key = cacheKey(zip);
      let state = await r.redis.getAsync(key);

      if (state !== null) {
        return state;
      }

      state = await getState();

      await r.redis
        .multi()
        .set(key, state)
        .expire(key, 15780000) // 6 months
        .execAsync();

      return state;
    }

    return await getState();
  }
};

export default zipStateCache;
