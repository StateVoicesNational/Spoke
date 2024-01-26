import { getConfig } from "../lib/config";
import SmartyStreetsSDK from "smartystreets-javascript-sdk";
import optOutMessageCache from "../../models/cacheable_queries/opt-out-message";

const SmartyStreetsCore = SmartyStreetsSDK.core;
const Lookup = SmartyStreetsSDK.usZipcode.Lookup;

const clientBuilder = new SmartyStreetsCore.ClientBuilder(
  new SmartyStreetsCore.StaticCredentials(
    getConfig("SMARTY_AUTH_ID"),
    getConfig("SMARTY_AUTH_TOKEN")
  )
);
const client = clientBuilder.buildUsZipcodeClient();

export const getOptOutMessage = async (_, { zip, defaultMessage }) => {
  const lookup = new Lookup();

  lookup.zipCode = zip;

  try {
    const res = await client.send(lookup);
    const lookupRes = res.lookups[0].result[0];

    if (lookupRes.valid) {
      const queryResult = await optOutMessageCache.query({organizationId: 1, state: lookupRes.zipcodes[0].stateAbbreviation});
      if(queryResult.length) {
        return queryResult[0]["message"];
      }
      return defaultMessage;
    }

    return defaultMessage;
  } catch (e) {
    console.error(e);
    return defaultMessage;
  }
};
