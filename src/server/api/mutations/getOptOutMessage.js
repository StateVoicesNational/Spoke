import { getConfig } from "../lib/config";
import SmartyStreetsSDK from "smartystreets-javascript-sdk";

const SmartyStreetsCore = SmartyStreetsSDK.core;
const Lookup = SmartyStreetsSDK.usZipcode.Lookup;

const clientBuilder = new SmartyStreetsCore.ClientBuilder(new SmartyStreetsCore.StaticCredentials(getConfig("SMARTY_AUTH_ID"), getConfig("SMARTY_AUTH_TOKEN")));
const client = clientBuilder.buildUsZipcodeClient();

function getDefaultOptOutMessage() {
    console.log("Default opt-out message");
    return "Default opt-out message";
}

export const getOptOutMessage = async (_, { zip }) => {
    const lookup = new Lookup();

    lookup.zipCode = zip;

    try {
        const res = await client.send(lookup);
        const lookupRes = res.lookups[0].result[0];

        if(lookupRes.valid) {
            console.log("state =", lookupRes.zipcodes[0].stateAbbreviation);
            return lookupRes.zipcodes[0].stateAbbreviation;
        }

        return getDefaultOptOutMessage();
    } catch (e) {
        console.error(e);
        return getDefaultOptOutMessage();
    }
};
