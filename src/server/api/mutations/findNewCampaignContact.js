import { log } from "../../../lib";
import telemetry from "../../telemetry";
import { Assignment, Campaign, r, cacheableData } from "../../models";
import { assignmentRequiredOrAdminRole } from "../errors";
import { getDynamicAssignmentBatchPolicies } from "../../../extensions/dynamicassignment-batches";

export const findNewCampaignContact = async (
  _,
  { assignment: bulKSendAssignment, assignmentId, numberContacts, batchType },
  { user, loaders }
) => {
  const falseRetVal = {
    found: false,
    assignment: {
      id: assignmentId,
      // stop people from getting another batch right after they get the current one
      hasUnassignedContactsForTexter: 0
    }
  };
  /* This attempts to find new contacts for the assignment, in the case that useDynamicAssigment == true */
  const assignment =
    bulKSendAssignment ||
    (await r
      .knex("assignment")
      .where("id", assignmentId)
      .first());
  if (!assignment) {
    return falseRetVal;
  }
  const campaign = await loaders.campaign.load(assignment.campaign_id);

  await assignmentRequiredOrAdminRole(
    user,
    campaign.organization_id,
    assignmentId,
    null,
    assignment
  );

  if (assignment.max_contacts === 0) {
    return falseRetVal;
  }

  let availableCount = Infinity;
  let policy = null;
  const organization = await loaders.organization.load(
    campaign.organization_id
  );
  const policyArgs = {
    r,
    loaders,
    cacheableData,
    organization,
    campaign,
    assignment,
    texter: user
  };

  if (!bulKSendAssignment) {
    const policies = getDynamicAssignmentBatchPolicies({
      organization,
      campaign
    });
    policy = batchType ? policies.find(p => p.name === batchType) : policies[0];
    if (!policies.length || !policy || !policy.requestNewBatchCount) {
      return falseRetVal; // to be safe, default to never
    }
    // default is finished-replies
    availableCount = await policy.requestNewBatchCount(policyArgs);
  }

  const contactsCount = await r.getCount(
    r.knex("campaign_contact").where("assignment_id", assignmentId)
  );

  numberContacts = Math.min(
    numberContacts || campaign.batch_size || 1,
    campaign.batch_size === null
      ? availableCount // if null, then probably a legacy campaign
      : campaign.batch_size,
    availableCount
  );

  if (
    assignment.max_contacts &&
    contactsCount + numberContacts > assignment.max_contacts
  ) {
    numberContacts = assignment.max_contacts - contactsCount;
  }

  let batchQuery = r
    .knex("campaign_contact")
    .select("id")
    .limit(numberContacts)
    .forUpdate();

  let hasCurrentQuery = r.knex("campaign_contact").where({
    assignment_id: assignmentId,
    message_status: "needsMessage",
    is_opted_out: false,
    campaign_id: campaign.id
  });
  if (policy && policy.selectContacts) {
    const policySelect = await policy.selectContacts(
      batchQuery,
      hasCurrentQuery,
      policyArgs
    );
    if (policySelect) {
      batchQuery = policySelect.batchQuery
        ? policySelect.batchQuery
        : batchQuery;
      hasCurrentQuery = policySelect.hasCurrentQuery
        ? policySelect.hasCurrentQuery
        : hasCurrentQuery;
    }
  } else {
    batchQuery = batchQuery
      .where({
        message_status: "needsMessage",
        is_opted_out: false,
        campaign_id: campaign.id
      })
      .whereNull("assignment_id");
  }

  // Don't add more if they already have that many
  const hasCurrent = await r.getCount(hasCurrentQuery);
  if (hasCurrent >= numberContacts) {
    return falseRetVal;
  }

  if (batchQuery.skipLocked && /pg|mysql/.test(r.knex.client.config.client)) {
    batchQuery.skipLocked();
  }

  const updatedCount = await r
    .knex("campaign_contact")
    .whereIn("id", batchQuery)
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

    await telemetry.reportEvent("Assignment Dynamic", {
      count: updatedCount,
      organizationId: campaign.organization_id
    });

    return {
      ...falseRetVal,
      found: true
    };
  } else {
    return falseRetVal;
  }
};
