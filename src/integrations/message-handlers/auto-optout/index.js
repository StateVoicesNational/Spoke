import { getConfig } from "../../../server/api/lib/config";
import { cacheableData, Message } from "../../../server/models";
import serviceMap from "../../../server/api/lib/services";

export const serverAdministratorInstructions = () => {
  return {
    description: `
      Based on certain message replies you can auto-optout people.
    `,
    setupInstructions: `Set environment/organization variables
       AUTO_OPTOUT_REGEX_LIST_BASE64
       This should be encoded to BASE64 after creating a JSON list object in the form:
       [{"regex": "....", "reason": "hostile"}]
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
  const conf = getConfig("AUTO_OPTOUT_REGEX_LIST_BASE64", organization);
  if (!conf) {
    return false;
  }
  try {
    JSON.parse(Buffer.from(conf, "base64").toString());
    return true;
  } catch (e) {
    console.log(
      "message-handler/auto-optout JSON parse of AUTO_OPTOUT_REGEX_LIST_BASE64 failed",
      e
    );
    return false;
  }
};

// export const preMessageSave = async () => {};

export const postMessageSave = async ({ message, organization }) => {
  if (message.is_from_contact) {
    const config = Buffer.from(
      getConfig("AUTO_OPTOUT_REGEX_LIST_BASE64", organization),
      "base64"
    ).toString();
    const regexList = JSON.parse(config || "[]");
    const matches = regexList.filter(matcher => {
      const re = new RegExp(matcher.regex, "i");
      return String(message.text).match(re);
    });

    if (matches.length) {
      console.log("auto-optout MATCH", matches);
      const reason = matches[0].reason || "auto_optout";
      // OPTOUT
      const contact = await cacheableData.campaignContact.load(
        message.campaign_contact_id
      );
      await cacheableData.optOut.save({
        cell: message.contact_number,
        campaignContactId: message.campaign_contact_id,
        assignmentId: contact.assignment_id,
        campaign: { organization_id: organization.id },
        reason
      });
    }
  }
};
