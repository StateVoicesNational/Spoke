import { cacheableData } from "../../../server/models";

export const name = "vetted-texters";

export const displayName = () => "Vetted Texters can request a new batch";

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
  if (!campaign.use_dynamic_assignment || campaign.is_archived) {
    return 0;
  }
  if (assignment.max_contacts === 0 || !campaign.batch_size) {
    return 0;
  }
  // ACCESS
  const isVetted = await cacheableData.user.userHasRole(
    texter.id === assignment.user_id ? texter : { id: assignment.user_id },
    campaign.organization_id,
    "VETTED_TEXTER"
  );
  if (!isVetted) {
    // Are there any assignments?
    const anyPrevious = await r
      .knex("campaign_contact")
      .where({
        campaign_id: campaign.id,
        assignment_id: assignment.id
      })
      .first();
    if (anyPrevious) {
      return 0;
    }
  }

  const availableCount = await r.getCount(
    r
      .knex("campaign_contact")
      .where({
        campaign_id: campaign.id,
        is_opted_out: false,
        message_status: "needsMessage"
      })
      .whereNull("assignment_id")
  );
  return availableCount;
};
