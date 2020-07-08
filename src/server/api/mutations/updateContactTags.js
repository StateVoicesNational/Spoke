import { assignmentRequiredOrAdminRole } from "../errors";
import { cacheableData } from "../../models";
import { jobRunner } from "../../../integrations/job-runners";
import { Tasks } from "../../../workers/tasks";
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

    const handlerNames = await ActionHandlers.rawAllTagUpdateActionHandlerNames();
    await Promise.all(
      handlerNames.map(name => {
        return jobRunner.dispatchTask(Tasks.ACTION_HANDLER_TAG_UPDATE, {
          name,
          tags,
          contact,
          campaign,
          organization,
          texter: {
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email
          }
        });
      })
    ).catch(e =>
      console.error("Dispatching to one or more tag handlers failed", e)
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `Error saving tagCampaignContact for campaignContactID ${campaignContactId} tags ${tags}  error ${err}`
    );
    throw err;
  }

  return contact.id;
};
