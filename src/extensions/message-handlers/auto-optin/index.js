import { getConfig, getFeatures } from "../../../server/api/lib/config";
import { cacheableData } from "../../../server/models";

const DEFAULT_AUTO_OPTIN_REGEX_LIST_BASE64 =
    "W3sicmVnZXgiOiAiXlNUQVJUJCIsICJyZWFzb24iOiAic3RhcnQifV0=";

// DEFAULT_AUTO_OPTIN_REGEX_LIST_BASE64 decodes to:
// [{"regex": "^START$"", "reason": "start"}]

export const serverAdministratorInstructions = () => {
    return {
        description: `Can add people to opt in list depending on the reply`,
        setupInstructions: `
            Add "auto-optin" to message hanlder environment variable.
            Can change default optin langauge by adding AUTO_OPTIN_REGEX_LIST_BASE64 to
            \`.env\`. This variable should be a JSON object encoded in base64. See line 8 for
            current structure. 
        `,
        environmentVariables: ["AUTO_OPTIN_REGEX_LIST_BASE64"]
    }
}

export const available = organization => {
    const config = getConfig("AUTO_OPTIN_REGEX_LIST_BASE64", organization) ||
        DEFAULT_AUTO_OPTIN_REGEX_LIST_BASE64;
    
    if (!config) return false;
    try {
        JSON.parse(Buffer.from(config, "base64").toString());
        return true;
    } catch (exception) {
        console.log(
            "message-handler/auto-optin JSON parse of AUTO_OPTIN_REGEX_LIST_BASE64 failed",
            exception
        );
        return false;
    }
}

export const preMessageSave = ({ messageToSave, organization }) => {
    if (messageToSave.is_from_contact) {
        const config = Buffer.from(
            getConfig("AUTO_OPTIN_REGEX_LIST_BASE64", organization) ||
            DEFAULT_AUTO_OPTIN_REGEX_LIST_BASE64,
            "base64"
        ).toString();
        const regexList = JSON.parse(config || "[]");
        const matches = regexList.filter(matcher => {
            const re = new RegExp(matcher.regex); // Want case sensitivity, probably?
            return String(messageToSave.text).match(re);
        })
        if (matches.length) {
            console.log(
                `auto-optin MATCH ${messageToSave.campaign_contact_id}`
            );
            const reason = matches[0].reason || "auto_optin";

            // UNSURE OF THIS RETURN
            return {
                contactUpdates: {
                    is_opted_in: true
                },
                handlerContext: {
                    autoOptInReason: reason,
                },
                messageToSave
            };
        }
    }
}

export const postMessageSave = async ({ 
    message, 
    organization, 
    handlerContext, 
    campaign 
}) => {
    if (!message.is_from_contact || !handlerContext.autoOptInReason) return;

    console.log(
        `auto-optin.postMessageSave ${message.campaign_contact_id}`
    );

    let contact = await cacheableData.campaignContact.load(
        message.campaign_contact_id,
        { cahceOnly: true}
    );
    campaign = campaign || { organization_id: organization.id};

    // Save to DB
    await cacheableData.optIn.save({
        cell: message.contact_number,
        campaign,
        assignmentId: (contact && contact.assignment_id) || null,
        reason: handlerContext.autoOptInReason
    });
}