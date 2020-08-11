import { accessRequired } from "../../../server/api/errors";

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
  try {
    await accessRequired(texter, organization.id, "VETTED_TEXTER");
  } catch (err) {
    return 0;
  }

  const availableCount = await r.getCount(
    r
      .knex("campaign_contact")
      .where({
        campaign_id: campaign.id,
        message_status: "needsMessage"
      })
      .whereNull("assignment_id")
  );
  return availableCount;
};
