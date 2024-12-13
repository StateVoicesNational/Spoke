import { hasConfig, getConfig } from "../../../server/api/lib/config";
import { r } from "../../../server/models";
import httpRequest from "../../../server/lib/http-request";
import {
    getCountryCode,
    getDashedPhoneNumberDisplay
} from "../../../lib/phone-format";
import Van from "../../contact-loaders/ngpvan/util";

export const serverAdministratorInstructions = () => {
    return {
        description: `
            Update the contact in VAN with an opt out status
            if and only if the internal Spoke auto-optout triggers.
            Manual opt outs are handled by a different process.
        `,
        setupInstructions: `
            This message handler is dependent on the ngpvan-action Action Handler,
            and the auto-optout Message Handler.
            Follow their setup instructions. 
            Additionally, "ngpvan-optout" must be added to the message handler
            environment variable. 
        `,
        // Does this include NGP_VAN env variables and what not?
        environmentVariables: []
    };
}

export const dbQuery = async campaignContactId => {
    return await r
        .knex("campaign_contact")
        .select("custom_fields")
        .where("id", campaignContactId)
}

export const available = organization =>
        (hasConfig("NGP_VAN_API_KEY", organization) ||
        hasConfig("NGP_VAN_API_KEY_ENCRYPTED", organization)) &&
        hasConfig("NGP_VAN_APP_NAME", organization) &&
        getConfig("MESSAGE_HANDLERS", organization).indexOf("auto-optout") !== -1;

/*  
 * Sends a request to VAN to place an opt out tag to an individual.
 */
export const postMessageSave = async ({ 
    handlerContext, 
    organization,
    message
}) => {
    // Redundent, but other message-handlers check this first as well
    if (!exports.available(organization)) return {};

    let query;          // store custom_fields of the contact
    let customField;
    let vanId;          // vanid of contact
    let cell;           // phone number that sent opt out message
    let phoneCountry;   // The coutnry code
    let url;            // url of VAN api

    // If no message or optOut, return
    if (
        !message ||
        !message.is_from_contact ||
        !handlerContext.autoOptOutReason
    ) return {};


    try {
        query = await exports.dbQuery(message.campaign_contact_id);
        customField = JSON.parse(query[0]["custom_fields"] || "{}");

        vanId = customField["VanID"] || customField["vanid"];
        cell = message["contact_number"] || "";
    } catch (exception) {
        console.error(
            `postMessageSave.ngpvan-optout ERROR finding contact or ` + 
            `parsing custom fields for contact ${message.campaign_contact_id}`
        )
    }
    
    // if no van id or cell #, return
    if (!vanId || !cell) return {};

    phoneCountry = process.env.PHONE_NUMBER_COUNTRY || "US";
    cell = getDashedPhoneNumberDisplay(cell, phoneCountry);

    url = Van.makeUrl(`v4/people/${vanId}/canvassResponses`, organization);

    // https://docs.ngpvan.com/reference/peoplevanidcanvassresponses
    const body = {
        "canvassContext": {
            "inputTypeId": 11, // API input
            "phone": {
                "dialingPrefix": getCountryCode(cell, phoneCountry).toString(),
                "phoneNumber": cell,
                "smsOptInStatus": "O" // opt out status
            }
        },
        // Do Not Text result code
        // Unsure if this is specfic to each VAN committe ?
        "resultCodeId": 130
    };

    console.log(`ngpvan-optout.postMessageSave VAN ID : ${vanId}`);

    await httpRequest(url, {
        method: "POST",
        retries: 1,
        timeout: Van.getNgpVanTimeout(organization),
        headers: {
            Authorization: await Van.getAuth(organization),
            "accept": "text/plain",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        validStatuses: [204],
        compress: false
    })

    return {};
}


