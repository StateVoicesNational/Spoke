import { getContacts } from "../../../server/api/assignment";

export const name = "finished-replies";

export const displayName = () => "After finishing current replies";

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
  // Make sure they don't have any needsResponse(s)
  if (availableCount) {
    const hasOpenReplies = await getContacts(
      assignment,
      {
        messageStatus: "needsResponse",
        validTimezone: true,
        isOptedOut: false
      },
      organization,
      campaign,
      true // forCount=true because we don't care about ordering
    ).first();
    if (hasOpenReplies) {
      return 0;
    }
  }

  return availableCount;
};
