import { getConfig } from "../../../server/api/lib/config";
import { cacheableData } from "../../../server/models";

export function displayName() {
  return "Auto Output";
}

const DEFAULT_AUTO_OPTOUT_REGEX_LIST_BASE64 =
  "W3sicmVnZXgiOiAiXlxccypzdG9wXFxifFxcYnJlbW92ZSBtZVxccyokfHJlbW92ZSBteSBuYW1lfFxcYnRha2UgbWUgb2ZmIHRoXFx3KyBsaXN0fFxcYmxvc2UgbXkgbnVtYmVyfGRvblxcVz90IGNvbnRhY3QgbWV8ZGVsZXRlIG15IG51bWJlcnxJIG9wdCBvdXR8c3RvcDJxdWl0fHN0b3BhbGx8Xlxccyp1bnN1YnNjcmliZVxccyokfF5cXHMqY2FuY2VsXFxzKiR8XlxccyplbmRcXHMqJHxeXFxzKnF1aXRcXHMqJCIsICJyZWFzb24iOiAic3RvcCJ9XQ==";

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
  const conf =
    getConfig("AUTO_OPTOUT_REGEX_LIST_BASE64", organization) ||
    DEFAULT_AUTO_OPTOUT_REGEX_LIST_BASE64;
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

export const preMessageSave = async ({ messageToSave, organization }) => {
  if (messageToSave.is_from_contact) {
    const config = Buffer.from(
      getConfig("AUTO_OPTOUT_REGEX_LIST_BASE64", organization) ||
        DEFAULT_AUTO_OPTOUT_REGEX_LIST_BASE64,
      "base64"
    ).toString();
    const regexList = JSON.parse(config || "[]");
    const matches = regexList.filter(matcher => {
      const re = new RegExp(matcher.regex, "i");
      return String(messageToSave.text).match(re);
    });
    // console.log("auto-optout", matches, messageToSave.text, regexList);
    if (matches.length) {
      console.log(
        "auto-optout MATCH",
        messageToSave.campaign_contact_id,
        matches
      );
      const reason = matches[0].reason || "auto_optout";
      messageToSave.error_code = -133;
      return {
        contactUpdates: {
          is_opted_out: true,
          error_code: -133,
          message_status: "closed"
        },
        handlerContext: { autoOptOutReason: reason },
        messageToSave
      };
    }
  }
};

export const postMessageSave = async ({
  message,
  organization,
  handlerContext
}) => {
  if (message.is_from_contact && handlerContext.autoOptOutReason) {
    console.log(
      "auto-optout.postMessageSave",
      message.campaign_contact_id,
      handlerContext.autoOptOutReason
    );
    const contact = await cacheableData.campaignContact.load(
      message.campaign_contact_id,
      { cacheOnly: true }
    );
    // OPTOUT
    await cacheableData.optOut.save({
      cell: message.contact_number,
      campaignContactId: message.campaign_contact_id,
      assignmentId: (contact && contact.assignment_id) || null,
      campaign: { organization_id: organization.id },
      noReply: true,
      reason: handlerContext.autoOptOutReason,
      // RISKY: we depend on the contactUpdates in preMessageSave
      // but this can relieve a lot of database pressure
      noContactUpdate: true,
      contact,
      organization,
      user: null // If this is auto-optout, there is no user happening.
    });
  }
};
