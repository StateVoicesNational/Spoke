import { getConfig, getFeatures } from "../../../server/api/lib/config";
import { cacheableData } from "../../../server/models";
import { getOptOutMessage } from "../../../server/api/mutations";
import { sendRawMessage } from "../../../server/api/mutations/sendMessage";

const DEFAULT_AUTO_OPTOUT_REGEX_LIST_BASE64 =
  "W3sicmVnZXgiOiAiXlxccypzdG9wXFxifFxcYnJlbW92ZSBtZVxccyokfHJlbW92ZSBteSBuYW1lfFxcYnRha2UgbWUgb2ZmIHRoXFx3KyBsaXN0fFxcYmxvc2UgbXkgbnVtYmVyfGRvblxcVz90IGNvbnRhY3QgbWV8ZGVsZXRlIG15IG51bWJlcnxJIG9wdCBvdXR8c3RvcDJxdWl0fHN0b3BhbGx8Xlxccyp1bnN1YnNjcmliZVxccyokfF5cXHMqY2FuY2VsXFxzKiR8XlxccyplbmRcXHMqJHxeXFxzKnF1aXRcXHMqJCIsICJyZWFzb24iOiAic3RvcCJ9XQ==";

// DEFAULT_AUTO_OPTOUT_REGEX_LIST_BASE64 converts to:

// [{"regex": "^\\s*stop\\b|\\bremove me\\s*$|remove my name|\\btake me off th\\w+ list|
// \\blose my number|don\\W?t contact me|delete my number|I opt out|stop2quit|stopall|
// ^\\s*unsubscribe\\s*$|^\\s*cancel\\s*$|^\\s*end\\s*$|^\\s*quit\\s*$", 
// "reason": "stop"}]

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

// Part of the auto-opt out process. 
// checks if message recieved states something like "stop", "quit", or "stop2quit"
export const preMessageSave = async ({ messageToSave, organization }) => {
  if (messageToSave.is_from_contact) {  // checks if message is from the contact
    const config = Buffer.from(
      getConfig("AUTO_OPTOUT_REGEX_LIST_BASE64", organization) ||
        DEFAULT_AUTO_OPTOUT_REGEX_LIST_BASE64,
      "base64"
    ).toString();  // converts DEFAULT_AUTO_OPTOUT_REGEX_LIST_BASE64 to regex
                   // can be custom set in .env w/ AUTO_OPTOUT_REGEX_LIST_BASE64
    const regexList = JSON.parse(config || "[]");
    const matches = regexList.filter(matcher => { // checks if message contains opt-out langauge
      const re = new RegExp(matcher.regex, "i");
      return String(messageToSave.text).match(re);
    });
    if (matches.length) {  // if more than one match, opt-out
      console.log(
        "auto-optout MATCH",
        `| campaign_contact_id: ${messageToSave.campaign_contact_id}`,
        `| reason: "${matches[0].reason}"`
      );
      const reason = matches[0].reason || "auto_optout"; // with default opt-out regex,
                                                         // reason will always be "stop"
      messageToSave.error_code = -133;
      return {
        contactUpdates: {
          is_opted_out: true,
          error_code: -133,
          message_status: "closed"
        },
        handlerContext: {
          autoOptOutReason: reason,
          autoOptOutShouldAutoRespond: matches[0].shouldAutoRespond
        },
        messageToSave
      };
    }
  }
};

export const postMessageSave = async ({
  message,
  organization,
  handlerContext,
  campaign
}) => {
  if (message.is_from_contact && handlerContext.autoOptOutReason) {
    console.log(
      "auto-optout.postMessageSave",
      `| campaign_contact_id: ${message.campaign_contact_id}`,
      `| opt-out reason: ${handlerContext.autoOptOutReason}`
    );
    let contact = await cacheableData.campaignContact.load(
      message.campaign_contact_id,
      { cacheOnly: true }
    );
    campaign = campaign || { organization_id: organization.id };

    // OPTOUT
    await cacheableData.optOut.save({
      cell: message.contact_number,
      campaignContactId: message.campaign_contact_id,
      assignmentId: (contact && contact.assignment_id) || null,
      campaign,
      noReply: true,
      reason: handlerContext.autoOptOutReason,
      // RISKY: we depend on the contactUpdates in preMessageSave
      // but this can relieve a lot of database pressure
      noContactUpdate: true,
      contact,
      organization,
      user: null // If this is auto-optout, there is no user happening.
    });

    if (
      handlerContext.autoOptOutShouldAutoRespond ||
      getConfig("SEND_AUTO_OPT_OUT_RESPONSE", organization)
    ) {
      // https://support.twilio.com/hc/en-us/articles/223134027-Twilio-support-for-opt-out-keywords-SMS-STOP-filtering-
      const twilioAutoOptOutWords = [
        "STOP",
        "STOPALL",
        "UNSUBSCRIBE",
        "CANCEL",
        "END",
        "QUIT"
      ];

      if (
        getConfig("DEFAULT_SERVICE", organization) == "twilio" &&
        twilioAutoOptOutWords.indexOf(message.text.toUpperCase().trim()) > -1
      ) {
        return;
      }

      contact =
        contact ||
        (await cacheableData.campaignContact.load(message.campaign_contact_id));

      const optOutMessage = await getOptOutMessage(null, {
        organizationId: organization.id,
        zip: contact.zip,
        defaultMessage:
          getFeatures(organization).opt_out_message ||
          getConfig("OPT_OUT_MESSAGE", organization) ||
          "I'm opting you out of texts immediately. Have a great day."
      });

      await sendRawMessage({
        finalText: optOutMessage,
        contact,
        campaign,
        organization,
        user: {}
      });
    }
  }
};