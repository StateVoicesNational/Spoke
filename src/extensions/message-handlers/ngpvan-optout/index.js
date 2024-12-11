import { hasConfig, getConfig } from "../../../server/api/lib/config";
const Van = require("../../../extensions/action-handlers/ngpvan-action");
import { r } from "../../../server/models";

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
        environmentVariables: []
    };
}

const dbQuery = async (campaignContactId) => {
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
    if (!exports.available(organization)) return {};

    let query;
    let customField;
    let vanId;
    let cell;

    // If no message or optOut, return
    if (
        !message ||
        !handlerContext.autoOptOutReason
    ) return {};

    // Grabs van id and phone number
    // While there may be multiple phone numbers,
    // we want to use the # we originally texted
    query = await dbQuery(message.campaign_campaign_id);
    customField = JSON.parse(query[0]["custom_fields"] || "{}");
    vanId = customField["VanID"] || customField["vanid"];
    cell = message["contact_number"] || ""; // Phone number

    // if no van id or cell #, return
    if (!vanId || !cell) return {};

    // https://docs.ngpvan.com/reference/peoplevanidcanvassresponses
    const body = {
        "canvassContext": {
            "inputTypeId": 11, // API input
            "phone": {
                "dialingPrefix": "1",
                "phoneNumber": cell,
                "smsOptInStatus": "O" // opt out status
            }
        },
        "resultCodeId": 130 // Do Not Text result code
    };

    return Van.postCanvassResponse(contact, organization, body)
            .then(() => ({}))
            .catch(caughtError => {
                // eslint-disable-next-line no-console
                console.log(
                    "Encountered exception in ngpvan-optout.postMessageSave",
                    caughtError
                )
                return {};
            })
}


