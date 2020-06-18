import { assignmentRequiredOrAdminRole } from "../errors";
import { cacheableData } from "../../models";
const ActionHandlers = require("../../../integrations/action-handlers");

export const updateContactTags = async (
  _,
  { tags, campaignContactId },
  { user }
) => {
  let contact;
  try {
    contact = await cacheableData.campaignContact.load(campaignContactId);
    const campaign = await cacheableData.campaign.load(contact.campaign_id);
    await assignmentRequiredOrAdminRole(
      user,
      campaign.organization_id,
      contact.assignment_id,
      contact
    );

    await cacheableData.tagCampaignContact.save(campaignContactId, tags);

    const organization = await cacheableData.organization.load(
      campaign.organization_id
    );

    // The rest is for ACTION_HANDLERS
    ActionHandlers.getActionHandlersAvailableForTagUpdate(
      organization,
      user
    ).then(supportedActionHandlers => {
      supportedActionHandlers.forEach(handler => {
        handler
          .onTagUpdate(tags, user, contact, campaign, organization)
          .catch(err => {
            // eslint-disable-next-line no-console
            console.error(
              `Error executing handler.onTagUpdate for ${handler.name}, campaignContactId ${campaignContactId} error ${err}`
            );
          });
      });
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `Error saving tagCampaignContact for campaignContactID ${campaignContactId} tags ${tags}  error ${err}`
    );
    throw err;
  }

  return contact.id;
};

export default updateContactTags;
