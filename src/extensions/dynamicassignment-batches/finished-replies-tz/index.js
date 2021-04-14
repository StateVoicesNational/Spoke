import { getContacts } from "../../../server/api/assignment";

export const name = "finished-replies-tz";

export const displayName = () =>
  "After finishing current replies, within Texting Hours";

export const requestNewBatchCount = async ({
  organization,
  campaign,
  assignment,
  texter,
  r,
  cacheableData,
  loaders,
  hasAny
}) => {
  // START WITH SOME BASE-LINE THINGS EVERY POLICY SHOULD HAVE
  if (!campaign.use_dynamic_assignment || campaign.is_archived) {
    return 0;
  }
  if (assignment.max_contacts === 0 || !campaign.batch_size) {
    return 0;
  }
  const countQuery = r
    .knex("campaign_contact")
    .where({
      campaign_id: campaign.id,
      is_opted_out: false,
      message_status: "needsMessage"
    })
    .whereNull("assignment_id");

  let availableCount = 0;
  if (hasAny) {
    availableCount = assignment.hasOwnProperty("hasUnassigned")
      ? assignment.hasUnassigned
      : (await countQuery.select("id").first())
      ? 1
      : 0;
  } else {
    availableCount = await r.getCount(countQuery);
  }
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
    )
      .select("campaign_contact.id")
      .first();
    if (hasOpenReplies) {
      return 0;
    }
  }
  return availableCount;
};

export const selectContacts = async (
  batchQuery,
  hasCurrentQuery,
  { campaign, organization, numberContacts }
) => ({
  batchQuery: getContacts(
    null, // no assignment to avoid filtering on one
    {
      messageStatus: "needsMessage",
      validTimezone: true,
      isOptedOut: false
    },
    organization,
    campaign,
    true // forCount=true means: do not order
  )
    .where("campaign_id", campaign.id)
    .whereNull("assignment_id")
    .select("id")
    .limit(numberContacts)
    .forUpdate()
});
