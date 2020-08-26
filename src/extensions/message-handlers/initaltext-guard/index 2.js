import { getConfig } from "../../../server/api/lib/config";
import { r, cacheableData, Message } from "../../../server/models";
import serviceMap from "../../../server/api/lib/services";

export const serverAdministratorInstructions = () => {
  return {
    description: `
       If initial texts deviate from the original script then automatically
       mark message and contact with an error-code.

       This can happen naturally when a campaigner updates the initial script
       after a campaign has already started.
    `,
    setupInstructions: `Just enable it -- only works when caching is on`,
    environmentVariables: []
  };
};

// note this is NOT async
export const available = organization => {
  // without caching
  return Boolean(r.redis);
};

const replacements = {
  "?": "\\?",
  "*": "\\*",
  "+": "\\+",
  "[": "\\[",
  "]": "\\]",
  "(": "\\(",
  ")": "\\)",
  "\\": "\\\\"
};

export const preMessageSave = async ({
  messageToSave,
  contact,
  campaign,
  texter
}) => {
  if (
    !messageToSave.is_from_contact &&
    contact &&
    contact.message_status === "needsMessage" &&
    contact.assignment_id &&
    campaign &&
    campaign.interactionSteps &&
    texter
  ) {
    const initialScript = campaign.interactionSteps.filter(
      is => is.parent_interaction_id === null
    )[0].script;
    let matchFailed = false;
    let regexScript = null;
    try {
      regexScript = new RegExp(
        "^" +
          initialScript
            .replace(/[?*+()\[\]\\]/g, a => replacements[a])
            .replace(/\{[^}]*\}/g, ".*") +
          "$"
      );
      matchFailed = !messageToSave.text.match(regexScript);
    } catch (err) {
      // give up -- maybe the script had a special character
      matchFailed = false;
    }
    if (matchFailed) {
      console.log(
        "initialtext-guard: detected different initial message",
        texter.id,
        contact.id,
        messageToSave.text,
        initialScript,
        regexScript
      );
      // // BLOCKED BY CASE: a script was recently edited,
      // // and the texter sends what their local script is.
      //
      // // 0. check if they are a vetted texter NEED: texter
      // const vetted = await cacheableData.user.userHasRole(
      //   texter,
      //   campaign.organization_id,
      //   "VETTED_TEXTER"
      // );
      // if (vetted) {
      //   return;
      // }
      // // 1. unassign the rest of the contacts
      // const contactIds = await r
      //   .knex("campaign_contact")
      //   .where({ assignment_id: contact.assignment_id })
      //   .select("id");

      // await r
      //   .knex("campaign_contact")
      //   .where({ assignment_id: contact.assignment_id })
      //   .update({ assignment_id: null });
      // // update cache? unassigned and.....
      // // 2. set max_contacts=0 on assignment and caching of contact ids
      // await r
      //   .knex("assignment")
      //   .where({ id: contact.assignment_id, campaign_id: campaign.id })
      //   .update({ max_contacts: 0 });

      // 3. mark contact
      await r
        .knex("campaign_contact")
        .where("id", contact.id)
        .update({ error_code: -167 });

      // 4. mark message
      Object.assign(messageToSave, {
        error_code: -167
      });
      return {
        messageToSave
      };
    }
  }
};
