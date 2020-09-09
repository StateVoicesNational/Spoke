import { cacheableData } from "../../../server/models";

export const name = "vetted-takeconversations";

export const displayName = () =>
  "Vetted Texters can take unassigned conversations";

export const requestNewBatchCount = async ({
  organization,
  campaign,
  assignment,
  texter,
  r,
  cacheableData,
  loaders
}) => {
  // START WITH SOME BASE-LINE THINGS EVERY POLICY SHOULD HAVE
  if (campaign.is_archived) {
    return 0;
  }
  if (assignment.max_contacts === 0) {
    return 0;
  }
  // ACCESS
  const isVetted = await cacheableData.user.userHasRole(
    texter.id === assignment.user_id ? texter : { id: assignment.user_id },
    campaign.organization_id,
    "VETTED_TEXTER"
  );
  if (!isVetted) {
    return 0;
  }

  const availableCount = await r.getCount(
    r
      .knex("campaign_contact")
      .where({
        campaign_id: campaign.id,
        is_opted_out: false
      })
      .whereNotIn("message_status", ["needsMessage", "messaged"])
      .whereNull("assignment_id")
  );
  return availableCount;
};

export const selectContacts = async (
  batchQuery,
  hasCurrentQuery,
  { assignment, campaign, r }
) => ({
  batchQuery: batchQuery
    .where({
      is_opted_out: false,
      campaign_id: campaign.id
    })
    .whereNotIn("message_status", ["needsMessage", "messaged"])
    .whereNull("assignment_id"),
  hasCurrentQuery: r
    .knex("campaign_contact")
    .where({
      assignment_id: assignment.id,
      is_opted_out: false,
      campaign_id: campaign.id
    })
    .whereIn("message_status", ["needsMessage", "needsResponse"])
});
