import { hasConfig } from "../../../server/api/lib/config";
const Van = require("../../../extensions/action-handlers/ngpvan-action");

export const serverAdministratorInstructions = () => {
    return {
        description: `
            Update the contact in VAN with an opt out status
            if and only if the internal Spoke auto-optout triggers.
        `,
        setupInstructions: `
            This message handler is dependent on the ngpvan-action Action Handler.
            Follow it's setup instructions. 
            Additionally, "ngpvan-optout" must be adde dot the message handler
            environment variable. 
        `,
        environmentVariables: []
    };
}

export const available = organization =>
    (hasConfig("NGP_VAN_API_KEY", organization) ||
        hasConfig("NGP_VAN_API_KEY_ENCRYPTED", organization)) &&
    hasConfig("NGP_VAN_APP_NAME", organization);
//

/*  Sends a request to VAN to place an opt out tag to an individual.
 *  Ideally, we would want to query VAN to see if anyone else is attached
 *  to the cell, but we are unable to do a blind query based soley on
 *  the number.
 */
export const postMessageSave = async ({ 
    message, 
    contact, 
    handlerContext, 
    organization 
}) => {
    if (!exports.available(organization)) return {};

    // TODO: Check VAN ID as well.
    // Maybe be good to check that we also got this contact
    // from a VAN upload?
    if (
        message.is_from_contact || 
        !contact ||
        !handlerContext.autoOptOutReason
    ) return {};

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


