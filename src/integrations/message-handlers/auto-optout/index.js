import { getConfig } from "../../../server/api/lib/config";
import { r, cacheableData } from "../../../server/models";
import serviceMap from "../../../server/api/lib/services";

export const serverAdministratorInstructions = () => {
  return {
    description: `
      Based on certain message replies you can auto-optout people.
    `,
    setupInstructions: `Set environment/organization variables
       AUTO_OPTOUT_REGEX_LIST_BASE64
       This should be encoded to BASE64 after creating a JSON list object in the form:
       [{"regex": "....", "reason": "hostile", "autoreply": true}]
       Be VERY careful about the regex -- if it is accidentally general,
       you might end up opting way more people out than you intended.
       Consider testing your AUTO_OPTOUT_REGEX_BASE64 with the PROFANITY TAGGER first
       and confirming that the list is what you expect.
    `,
    environmentVariables: ["AUTO_OPTOUT_REGEX_LIST_BASE64", "OPT_OUT_MESSAGE"]
  };
};

// note this is NOT async
export const available = organization => {
  return getConfig("AUTO_OPTOUT_REGEX_BASE64", organization);
};

// export const preMessageSave = async () => {};

export const postMessageSave = async ({ message, campaign, organization }) => {
  if (message.is_from_contact) {
    const config = Buffer.from(
      getConfig("AUTO_OPTOUT_REGEX_LIST_BASE64", organization),
      "base64"
    ).toString();

    const regexList = JSON.parse(config || []);
    const matches = regexList.filter(matcher => {
      const re = new RegExp(matcher.regex, "i");
      return String(message.text).match(re);
    });

    if (matches.length) {
      const reason = matches[0].reason || "auto_optout";
      const shouldAutoReply = matches[0].autoreply;
      // OPTOUT
      const contact = await cacheableData.campaignContact.load(
        message.campaign_contact_id
      );
      await cacheableData.optOut.save({
        cell: message.contact_number,
        campaignContactId: message.campaign_contact_id,
        assignmentId: contact.assignment_id,
        reason,
        campaign
      });

      if (shouldAutoReply && message.service) {
        const service = serviceMap[message.service];
        const autoReplyMessage =
          typeof shouldAutoReply === "string"
            ? shouldAutoReply
            : getConfig("opt_out_message", organization) ||
              getConfig("OPT_OUT_MESSAGE", organization) ||
              "I'm opting you out of texts immediately. Have a great day.";
        const messageInstance = new Message({
          text: autoReplyMessage,
          contact_number: message.contact_number,
          user_number: "",
          user_id: null,
          campaign_contact_id: message.campaign_contact_id,
          messageservice_sid: null,
          send_status: "SENDING",
          service: message.service,
          is_from_contact: false,
          queued_at: new Date(),
          send_before: new Date()
        });
        const saveResult = await cacheableData.message.save({
          messageInstance,
          contact,
          campaign,
          organization
        });
        if (saveResult.message) {
          // FUTURE use dispatchTask when
          await service.sendMessage(
            saveResult.message,
            contact,
            null,
            organization,
            campaign
          );
        }
      }
    }
  }
};
