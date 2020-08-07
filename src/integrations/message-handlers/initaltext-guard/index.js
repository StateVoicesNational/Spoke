import { getConfig } from "../../../server/api/lib/config";
import { r, cacheableData, Message } from "../../../server/models";
import serviceMap from "../../../server/api/lib/services";

export function displayName() {
  return "Initial Text Guard";
}

export const serverAdministratorInstructions = () => {
  return {
    description: `
       If initial texts deviate from the original script then automatically
       unassign the rest of the contacts and set max_contacts=0 for that
       campaign.

       VETTED_TEXTERs and above will not be blocked in the same way.
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

// export const preMessageSave = async () => {};

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
    try {
      const regexScript = new RegExp(
        "^" + initialScript.replace(/\{[^}]*\}/, ".*") + "$"
      );
      matchFailed = !messageToSave.text.match(regexScript);
    } catch (err) {
      // give up -- maybe the script had a special character
      matchFailed = false;
    }
    if (matchFailed) {
      // 0. check if they are a vetted texter NEED: texter
      const vetted = await cacheableData.user.userHasRole(
        texter,
        campaign.organization_id,
        "VETTED_TEXTER"
      );
      console.log(
        "initialtext-guard: detected different initial message",
        texter.id,
        vetted,
        contact.id,
        messageToSave.text,
        initialScript
      );
      if (vetted) {
        return;
      }
      // 1. unassign the rest of the contacts
      const contactIds = await r
        .knex("campaign_contact")
        .where({ assignment_id: contact.assignment_id })
        .select("id");

      await r
        .knex("campaign_contact")
        .where({ assignment_id: contact.assignment_id })
        .update({ assignment_id: null });
      // update cache? unassigned and.....
      // 2. set max_contacts=0 on assignment and caching of contact ids
      await r
        .knex("assignment")
        .where({ id: contact.assignment_id, campaign_id: campaign.id })
        .update({ max_contacts: 0 });
      // 3. mark message
      Object.assign(messageToSave, {
        error_code: -167
      });
      return {
        messageToSave
      };
    }
  }
};
