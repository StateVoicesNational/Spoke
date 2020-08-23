import { getConfig } from "../../../server/api/lib/config";
import { r, cacheableData } from "../../../server/models";

export const serverAdministratorInstructions = () => {
  return {
    description: `
      When enabled, campaigns with the description containing the text
      "outbound-unassign" upon a contact replying to the initial
      message the contact will be unassigned from the initial texter.
      This allows separation of initial texters and repliers.
      It pairs well with texter-sidebox "take-conversations"
    `,
    setupInstructions: `Just enable it and mark relevant campaigns`,
    environmentVariables: []
  };
};

// note this is NOT async
export const available = organization => true;

export const preMessageSave = async ({ contact, campaign, messageToSave }) => {
  if (
    !messageToSave.is_from_contact &&
    contact.id &&
    contact.assignment_id &&
    contact.message_status === "needsMessage" &&
    r.redis &&
    campaign &&
    campaign.description &&
    /outbound-unassign/.test(campaign.description)
  ) {
    await cacheableData.campaignContact.updateAssignmentCache(
      contact.id,
      null,
      null,
      contact.campaign_id
    );
    contact.assignment_id = null;
    return {
      contactUpdates: { assignment_id: null }
    };
  }
  return {};
};
