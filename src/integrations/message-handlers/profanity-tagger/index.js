import { getConfig } from "../../../server/api/lib/config";
import { cacheableData } from "../../../server/models";

// Besides a bunch of horrible words, this includes "fakeslur" for easier testing.
// These defaults include offensive slurs but do not include e.g. "fu**" or "sh**"
// though they include some variants of those words -- the (default) goal is not to flag
// descriptive language, but hostile language.  This can be customized by an env or organization setting.
export const DEFAULT_PROFANITY_REGEX_BASE64 =
  "ZmFrZXNsdXJ8YXNzaG9sZXxiaXRjaHxibG93am9ifGJyb3duaWV8Y2hpbmt8Y29ja3xjb29ufGN1Y2t8Y3VudHxkYXJreXxkaWNraGVhZHxmYWdnb3R8ZmFydHxmcmlnaWR8ZnVja2JveXxmdWNrZXJ8Z29va3xoZWVifGppZ2Fib298a2lrZXxsaWNrIG18bWFjYWNhfG15IGRpY2t8bXkgYXNzfG5lZ3JvfG5pZ2dlcnxuaWdyYXxwcmlja3xwdXNzeXxxdWltfHJhcGV8cmV0YXJkfHNoZWVuaWV8c2hpdGhlYWR8c2h5bG9ja3xzaHlzdGVyfHNsdXR8c3BpY3xzcGlrfHN1Y2sgbXl8dGFjb2hlYWR8dGl0c3x0b3dlbGhlYWR8dHJhbm5pZXx0cmFubnl8dHVyZHx0d2F0fHdhbmt8d2V0YmFja3x3aG9yZXx5aWQ=";

export const serverAdministratorInstructions = () => {
  return {
    description: `
      When inappropriate words are used by contacts or texters they
      can be automatically tagged for review.
    `,
    setupInstructions: `After deciding the Regular Expression to match profanity if you go to the node js
       shell and run
         Buffer.from("YOUR|BAD|WORD|REGEX|HERE").toString('base64')
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
      getConfig("PROFANITY_REGEX_BASE64", organization) ||
      DEFAULT_PROFANITY_REGEX_BASE64;
    const re = new RegExp(Buffer.from(regexText, "base64").toString(), "i");
    if (String(message.text).match(re)) {
      console.log("MATCH", message.text);
      await cacheableData.tagCampaignContact.save(message.campaign_contact_id, [
        { id: tag_id }
      ]);
    }
  }
};
