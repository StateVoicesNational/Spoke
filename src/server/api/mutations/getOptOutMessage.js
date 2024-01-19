import { getConfig } from "../lib/config";
import SmartyStreetsSDK from "smartystreets-javascript-sdk";

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
      console.log("state =", lookupRes.zipcodes[0].stateAbbreviation);
      return defaultMessage;
    }

    return defaultMessage;
  } catch (e) {
    console.error(e);
    return defaultMessage;
  }
};
