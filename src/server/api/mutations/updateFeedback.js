import { r, cacheableData } from "../../models";
import { assignmentRequiredOrAdminRole } from "../errors";

export const updateFeedback = async (
  _,
  { assignmentId, feedback, acknowledge },
  { user }
) => {
  const assignment = await cacheableData.assignment.load(assignmentId);
  const campaign = await cacheableData.campaign.load(assignment.campaign_id);
  await assignmentRequiredOrAdminRole(
    user,
    campaign.organization_id,
    assignmentId,
    null,
    assignment
  );

  if (acknowledge) {
    await r
      .knex("assignment_feedback")
      .where("assignment_id", assignmentId)
      .update({ is_acknowledged: true });
    return {
      id: assignmentId,
      feedback: {
        isAcknowledged: true
      }
    };
  }
  try {
    if (!feedback.createdBy || isNaN(feedback.createdBy)) {
      feedback.createdBy = user.id;
    }
    if (feedback.isAcknowledged === undefined) feedback.isAcknowledged = false;
    if (feedback.sweepComplete === undefined) feedback.sweepComplete = false;
    /* eslint-disable no-underscore-dangle */
    if (feedback.__typename) delete feedback.__typename;
    if (feedback.issueCounts.__typename) delete feedback.issueCounts.__typename;
    if (feedback.skillCounts.__typename) delete feedback.skillCounts.__typename;

    const updateCount = await r
      .knex("assignment_feedback")
      .where("assignment_id", assignmentId)
      .update({ feedback, is_acknowledged: false });
    if (!updateCount) {
      await r.knex("assignment_feedback").insert({
        assignment_id: assignmentId,
        creator_id: user.id,
        feedback: feedback,
        is_acknowledged: false,
        complete: feedback.sweepComplete
      });
    }
    return { id: assignmentId, feedback };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `Error saving assignment texter feedback for assignmentId ${assignmentId}`
    );
    throw err;
  }
};
