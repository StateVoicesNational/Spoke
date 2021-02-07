import { log } from "../../../lib";
import { Assignment, r, cacheableData } from "../../models";
import { assignmentRequiredOrAdminRole } from "../errors";

export const releaseContacts = async (
  _,
  { assignmentId, releaseConversations },
  { user }
) => {
  /* This releases contacts for an assignment, needsMessage by-default, and all if releaseConversations=true */
  const assignment = await r
    .knex("assignment")
    .where("id", assignmentId)
    .first();
  if (!assignment) {
    return null;
  }
  const campaign = await cacheableData.campaign.load(assignment.campaign_id);

  await assignmentRequiredOrAdminRole(
    user,
    campaign.organization_id,
    assignmentId,
    null,
    assignment
  );

  let releaseQuery = r.knex("campaign_contact").where({
    assignment_id: assignmentId,
    campaign_id: assignment.campaign_id
  });
  if (!releaseConversations) {
    releaseQuery = releaseQuery.where("message_status", "needsMessage");
  } else {
    assignment.allcontactscount = 0;
    assignment.hascontacts = 0;
  }
  const updateCount = await releaseQuery.update("assignment_id", null);
  if (updateCount) {
    await cacheableData.campaign.incrCount(
      assignment.campaign_id,
      "assignedCount",
      -updateCount
    );
  }
  return {
    ...assignment,
    contacts: [],
    unmessagedcount: 0,
    hasunmessaged: 0,
    // hacky way to refresh apollo-client cache
    maybeunrepliedcount: 0,
    maybeallcontactscount: 0
  };
};
