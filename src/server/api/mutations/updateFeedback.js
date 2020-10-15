import { accessRequired } from "../errors";
import { r, cacheableData } from "../../models";

export const updateFeedback = async (
  _,
  { assignmentId, feedback },
  { user }
) => {
  try {
    const assignment = await cacheableData.assignment.load(assignmentId);
    const organization = await cacheableData.campaign.loadCampaignOrganization({
      campaignId: assignment.campaign_id
    });
    await accessRequired(user, organization.id, "SUPERVOLUNTEER");

    /* eslint-disable no-param-reassign */
    feedback = JSON.parse(feedback);

    if (!feedback.createdBy || isNaN(feedback.createdBy)) {
      feedback.createdBy = user.id;
    }
    if (feedback.isAcknowledged === undefined) feedback.isAcknowledged = false;
    /* eslint-disable no-underscore-dangle */
    if (feedback.__typename) delete feedback.__typename;
    if (feedback.issueCounts.__typename) delete feedback.issueCounts.__typename;

    await r
      .knex("assignment")
      .where("id", assignmentId)
      .update({ feedback });

    return { id: assignmentId, feedback };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `Error saving assignment texter feedback for assignmentId ${assignmentId}`
    );
    throw err;
  }
};
