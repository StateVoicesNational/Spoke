import { hasConfig, getConfig } from "../../../server/api/lib/config";
const Van = require("../../../extensions/action-handlers/ngpvan-action");

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

export const available = organization =>
        (hasConfig("NGP_VAN_API_KEY", organization) ||
        hasConfig("NGP_VAN_API_KEY_ENCRYPTED", organization)) &&
        hasConfig("NGP_VAN_APP_NAME", organization) &&
        getConfig("MESSAGE_HANDLERS", organization).indexOf("auto-optout") !== -1;

/*  Sends a request to VAN to place an opt out tag to an individual.
 */
export const postMessageSave = async ({ 
    contact, 
    handlerContext, 
    organization 
}) => {
    if (!exports.available(organization)) return {};

    let customField;
    let vanId;

    if (
        !contact ||
        !handlerContext.autoOptOutReason
    ) return {};

    // Checking for vanID in contact
    // While Van.postCanvassResponse will check the customFields, 
    // we don't want to call that function every time if a vanid
    // was never provided in the first place. Example: CSV
    try {
        customField = JSON.parse(contact.customFields);
        vanId = customField.VanID || customField.vanid;
        if (!vanId) return {}
    } catch (exception) {
        console.log("message-handlers | ngpvan-optout ERROR", exception);
        return {};
    }

    // Testing shows that "-" , "(", and ")" break this request
    const cell = contact.cell.replace(/\D/g,'')

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
        "resultCodeId": 205
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


