import { getConfig } from "../../../server/api/lib/config";
import { r, cacheableData } from "../../../server/models";

// Besides a bunch of horrible words, this includes "fakeslur" for easier testing.
// These defaults include offensive slurs but do not include e.g. "fu**" or "sh**"
// though they include some variants of those words -- the (default) goal is not to flag
// descriptive language, but hostile language.  This can be customized by an env or organization setting.
export const DEFAULT_PROFANITY_REGEX_BASE64 =
  "ZmFrZXNsdXJ8XGJhc3NcYnxhc3Nob2xlfGJpdGNofGJsb3dqb2J8YnJvd25pZXxjaGlua3xjb2NrfGNvb258Y3Vja3xjdW50fGRhcmt5fGRpY2toZWFkfFxiZGllXGJ8ZmFnZ290fGZhaXJ5fGZhcnR8ZnJpZ2lkfGZ1Y2tib3l8ZnVja2VyfGdvb2t8aGVlYnxcYmhvZVxifFxiaG9tb1xifGppZ2Fib298a2lrZXxra2t8a3Uga2x1eCBrbGFufGxpY2sgbXxtYWNhY2F8bW9sZXN0fG15IGRpY2t8bXkgYXNzfG5lZ3JvfG5pZ2dlcnxuaWdyYXxwZWRvfHBpc3N8cHJpY2t8cHVzc3l8cXVpbXxyYXBlfHJldGFyZHxzaGVlbmllfHNoaXRoZWFkfHNoeWxvY2t8c2h5c3RlcnxzbHV0fHNwaWN8c3Bpa3xzdWNrIG15fHRhY29oZWFkfHRpdHN8dG93ZWxoZWFkfHRyYW5uaWV8dHJhbm55fFxidHVyZHx0dXJkXGJ8dHdhdHx3YW5rfHdldGJhY2t8d2hvcmV8eWlk";

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
      "PROFANITY_REGEX_BASE64",
      "PROFANITY_TEXTER_REGEX_BASE64",
      "PROFANITY_TEXTER_SUSPEND_COUNT",
      "PROFANITY_TEXTER_BLOCK_SEND"
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

export const preMessageSave = async ({ messageToSave, organization }) => {
  if (
    !messageToSave.is_from_contact &&
    getConfig("PROFANITY_TEXTER_BLOCK_SEND", organization, { truthy: true })
  ) {
    const tagId = getConfig("PROFANITY_TEXTER_TAG_ID", organization);
    const regexText =
      getConfig("PROFANITY_TEXTER_REGEX_BASE64", organization) ||
      getConfig("PROFANITY_REGEX_BASE64", organization) ||
      DEFAULT_PROFANITY_REGEX_BASE64;
    const re = new RegExp(Buffer.from(regexText, "base64").toString(), "i");
    if (tagId && String(messageToSave.text).match(re)) {
      Object.assign(messageToSave, {
        send_status: "ERROR",
        error_code: -166
      });
      return {
        messageToSave
      };
    }
  }
  return {};
};

async function maybeSuspendTexter(
  suspendThreshold,
  message,
  organization,
  tagId,
  matchRegex
) {
  // we need to get the messages again, to confirm that it was *this* user that sent them
  // FUTURE: if tag_campaign_contact had a creator_id column, then we could probably just do a count
  // (where we would set the creator_id above to the message.user_id)
  const badTexts = await r
    .knex("campaign_contact")
    .select("message.text")
    .join("campaign", "campaign.id", "campaign_contact.campaign_id")
    .join("assignment", "assignment.id", "campaign_contact.assignment_id")
    .join("message", "message.campaign_contact_id", "campaign_contact.id")
    .join(
      "tag_campaign_contact",
      "tag_campaign_contact.campaign_contact_id",
      "campaign_contact.id"
    )
    .where({
      "tag_campaign_contact.tag_id": tagId,
      "campaign.is_archived": false,
      "assignment.user_id": message.user_id,
      "message.user_id": message.user_id,
      "message.is_from_contact": false
    });
  const badTextsCount = badTexts.filter(m => m.text && m.text.match(matchRegex))
    .length;
  if (badTextsCount >= Number(suspendThreshold)) {
    await r
      .knex("user_organization")
      .where({
        user_id: message.user_id,
        organization_id: organization.id
      })
      .update({ role: "SUSPENDED" });
    await cacheableData.user.clearUser(message.user_id);
  }
}

export const postMessageSave = async ({ message, organization }) => {
  let tagId = null;
  let regexText = null;
  if (message.is_from_contact) {
    tagId = getConfig("PROFANITY_CONTACT_TAG_ID", organization);
    regexText =
      getConfig("PROFANITY_REGEX_BASE64", organization) ||
      DEFAULT_PROFANITY_REGEX_BASE64;
  } else {
    tagId = getConfig("PROFANITY_TEXTER_TAG_ID", organization);
    regexText =
      getConfig("PROFANITY_TEXTER_REGEX_BASE64", organization) ||
      getConfig("PROFANITY_REGEX_BASE64", organization) ||
      DEFAULT_PROFANITY_REGEX_BASE64;
  }

  if (tagId) {
    const re = new RegExp(Buffer.from(regexText, "base64").toString(), "i");
    if (String(message.text).match(re)) {
      await cacheableData.tagCampaignContact.save(message.campaign_contact_id, [
        { id: tagId }
      ]);
      if (!message.is_from_contact) {
        // SUSPENDING TEXTER
        const suspendThreshold = getConfig(
          "PROFANITY_TEXTER_SUSPEND_COUNT",
          organization
        );
        if (suspendThreshold) {
          await maybeSuspendTexter(
            suspendThreshold,
            message,
            organization,
            tagId,
            re
          );
        }

        // BLOCKING SEND
        if (
          getConfig("PROFANITY_TEXTER_BLOCK_SEND", organization, {
            truthy: true
          })
        ) {
          return { blockSend: true };
        }
      }
    }
  }
  return null;
};
