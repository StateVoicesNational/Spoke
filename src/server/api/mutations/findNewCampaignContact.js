import { log } from "../../../lib";
import { Assignment, Campaign, r, cacheableData } from "../../models";
import { assignmentRequiredOrAdminRole } from "../errors";

export const findNewCampaignContact = async (
  _,
  { assignment: assignmentParameter, assignmentId, numberContacts },
  { user }
) => {
  /* This attempts to find new contacts for the assignment, in the case that useDynamicAssigment == true */
  const assignment =
    assignmentParameter || (await Assignment.get(assignmentId));
  const campaign = await cacheableData.campaign.load(assignment.campaign_id);

  await assignmentRequiredOrAdminRole(
    user,
    campaign.organization_id,
    assignmentId,
    null,
    assignment
  );

  if (!campaign.use_dynamic_assignment || assignment.max_contacts === 0) {
    return {
      found: false
    };
  }

  const contactsCount = await r.getCount(
    r.knex("campaign_contact").where("assignment_id", assignmentId)
  );

  numberContacts = Math.min(
    numberContacts || campaign.batch_size || 1,
    campaign.batch_size === null
      ? 1 // if null, then probably a legacy campaign
      : campaign.batch_size
  );

  if (
    assignment.max_contacts &&
    contactsCount + numberContacts > assignment.max_contacts
  ) {
    numberContacts = assignment.max_contacts - contactsCount;
  }

  // Don't add more if they already have that many
  const result = await r.getCount(
    r.knex("campaign_contact").where({
      assignment_id: assignmentId,
      message_status: "needsMessage",
      is_opted_out: false
    })
  );
  if (result >= numberContacts) {
    return {
      found: false
    };
  }

  const updatedCount = await r
    .knex("campaign_contact")
    .where(
      "id",
      "in",
      r
        .knex("campaign_contact")
        .where({
          assignment_id: null,
          campaign_id: campaign.id
        })
        .limit(numberContacts)
        .select("id")
    )
    .update({
      assignment_id: assignmentId
    })
    .catch(log.error);

  if (updatedCount > 0) {
    await cacheableData.campaign.incrCount(
      campaign.id,
      "assignedCount",
      updatedCount
    );
    return {
      found: true
    };
  } else {
    return {
      found: false
    };
  }
};
