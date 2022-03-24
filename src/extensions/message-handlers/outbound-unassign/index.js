import { getConfig, getFeatures } from "../../../server/api/lib/config";
import { r, cacheableData } from "../../../server/models";

export const serverAdministratorInstructions = () => {
  return {
    description: `
      When enabled, campaigns with texter-sidebox "take-conversations"
      and the "Enable initial outbound unassign" feature enabled
      will unassign the texter of the initial message upon
      the first message being sent.
      This allows separation of initial texters and repliers.
      It pairs well with texter-sidebox "take-conversations"
    `,
    setupInstructions: `Just enable it and the texter-sidebox "take-conversations"`,
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
    campaign
  ) {
    const features = getFeatures(campaign);
    if (
      features &&
      features.TEXTER_UI_SETTINGS &&
      JSON.parse(features.TEXTER_UI_SETTINGS).takeConversationsOutboundUnassign
    ) {
      if (r.redis) {
        await cacheableData.campaignContact.updateAssignmentCache(
          contact.id,
          null,
          null,
          contact.campaign_id
        );
      }
      contact.assignment_id = null;
      return {
        contactUpdates: { assignment_id: null }
      };
    }
  }
  return {};
};
