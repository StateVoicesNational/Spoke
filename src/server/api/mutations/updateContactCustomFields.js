import { assignmentRequiredOrAdminRole } from "../errors";
import { cacheableData } from "../../models";

export const updateContactCustomFields = async (
  _,
  { campaignContactId, customFields },
  { user, loaders }
) => {
  let contact;
  try {
    contact = await cacheableData.campaignContact.load(campaignContactId);
    const campaign = await loaders.campaign.load(contact.campaign_id);
    const organization = await loaders.organization.load(
      campaign.organization_id
    );

    await assignmentRequiredOrAdminRole(
      user,
      campaign.organization_id,
      contact.assignment_id,
      contact
    );

    await cacheableData.campaignContact.updateCustomFields(
      contact,
      customFields,
      campaign,
      organization
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `Error updating contact campaignContactID: ${campaignContactId}` +
        ` customFields: ${customFields} error: ${err}`
    );
    throw err;
  }

  if (typeof customFields === "string") {
    try {
      // eslint-disable-next-line no-param-reassign
      customFields = JSON.parse(customFields || "{}");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }

  return {
    id: contact.id,
    customFields
  };
};
