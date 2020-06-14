import { getConfig } from "../../../server/api/lib/config";
import { cacheableData } from "../../../server/models";

export const serverAdministratorInstructions = () => {
  return {
    description: `
      When inappropriate words are used by contacts or texters they
      can be automatically tagged for review.
    `,
    setupInstructions: `After deciding the Regular Expression to match profanity if you go to the node js
       shell and run
         (new Buffer("(YOUR|BAD|WORD|REGEX|HERE)")).toString('base64')
       and set that in PROFANITY_REGEX_BASE64.
       Create either or both tags for contact and texter tagging (or they can be the same tag)
       and set the ids in the corresponding environment variable.
    `,
    environmentVariables: [
      "PROFANITY_CONTACT_TAG_ID",
      "PROFANITY_TEXTER_TAG_ID",
      "PROFANITY_REGEX_BASE64"
    ]
  };
};

// note this is NOT async
export const available = organization => {
  return (
    getConfig("EXPERIMENTAL_TAGS", organization) &&
    (getConfig("PROFANITY_CONTACT_TAG_ID", organization) ||
      getConfig("PROFANITY_TEXTER_TAG_ID", organization))
  );
};

// export const preMessageSave = async () => {};

export const postMessageSave = async ({ message, organization }) => {
  let tag_id = null;
  if (message.is_from_contact) {
    tag_id = getConfig("PROFANITY_CONTACT_TAG_ID", organization);
  } else {
    tag_id = getConfig("PROFANITY_TEXTER_TAG_ID", organization);
  }
  if (tag_id) {
    const regexText =
      getConfig("PROFANITY_REGEX_BASE64", organization) || "c2hpW3RrXXxmdWNr";
    const re = new RegExp(Buffer.from(regexText, "base64").toString());
    if (String(message.text).match(re)) {
      console.log("MATCH", message.text);
      await cacheableData.tagCampaignContact.save(message.campaign_contact_id, [
        { id: tag_id }
      ]);
    }
  }
};
