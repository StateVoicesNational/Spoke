import { mapFieldsToModel } from "./lib/utils";
import { getConfig } from "./lib/config";
import { Assignment, r, cacheableData } from "../models";
import { getOffsets, defaultTimezoneIsBetweenTextingHours } from "../../lib";
import { getDynamicAssignmentBatchPolicies } from "../../extensions/dynamicassignment-batches";

export function addWhereClauseForContactsFilterMessageStatusIrrespectiveOfPastDue(
  queryParameter,
  messageStatusFilter
) {
  if (!messageStatusFilter) {
    return queryParameter;
  }

  let query = queryParameter;
  if (messageStatusFilter === "needsMessageOrResponse") {
    query.whereIn("message_status", ["needsResponse", "needsMessage"]);
  } else if (messageStatusFilter === "allReplies") {
    query.whereNotIn("message_status", ["messaged", "needsMessage"]);
  } else if (messageStatusFilter === "needsResponseExpired") {
    query
      .where("message_status", "needsResponse")
      .whereNotNull("campaign.response_window")
      .whereRaw(
        /sqlite/.test(r.knex.client.config.client)
          ? // SQLITE:
            "24 * (julianday('now') - julianday(campaign_contact.updated_at)) > campaign.response_window"
          : // POSTGRES:
            "now() - campaign_contact.updated_at > interval '1 hour' * campaign.response_window"
      );
  } else {
    query.whereIn("message_status", messageStatusFilter.split(","));
  }
  if (getConfig("CONVERSATIONS_RECENT")) {
    query.whereRaw(
      "campaign_contact.id > (SELECT max(id)-20000000 from campaign_contact)"
    );
  }
  return query;
}

export function getCampaignOffsets(campaign, organization, timezoneFilter) {
  const textingHoursEnforced = organization.texting_hours_enforced;
  const textingHoursStart = organization.texting_hours_start;
  const textingHoursEnd = organization.texting_hours_end;

  const config = {
    textingHoursStart,
    textingHoursEnd,
    textingHoursEnforced,
    defaultTimezone: getConfig("DEFAULT_TZ", organization)
  };

  if (campaign.override_organization_texting_hours) {
    const textingHoursStart = campaign.texting_hours_start;
    const textingHoursEnd = campaign.texting_hours_end;
    const textingHoursEnforced = campaign.texting_hours_enforced;
    const timezone = campaign.timezone;

    config.campaignTextingHours = {
      textingHoursStart,
      textingHoursEnd,
      textingHoursEnforced,
      timezone
    };
  }
  const [validOffsets, invalidOffsets] = getOffsets(
    config,
    campaign.contactTimezones
  );
  const defaultIsValid = defaultTimezoneIsBetweenTextingHours(config);
  if (timezoneFilter === true && defaultIsValid) {
    // missing timezone ok
    validOffsets.push("");
  } else if (timezoneFilter === false && !defaultIsValid) {
    invalidOffsets.push("");
  }

  return {
    validOffsets,
    invalidOffsets
  };
}

export function getContacts(
  assignment,
  contactsFilter,
  organization,
  campaign,
  forCount = false
) {
  // / returns list of contacts eligible for contacting _now_ by a particular user
  // 24-hours past due - why is this 24 hours offset?
  const includePastDue = contactsFilter && contactsFilter.includePastDue;
  const pastDue =
    campaign.due_by &&
    Number(campaign.due_by) + 24 * 60 * 60 * 1000 < Number(new Date());
  const { validOffsets, invalidOffsets } = getCampaignOffsets(
    campaign,
    organization,
    contactsFilter && contactsFilter.validTimezone
  );
  if (
    !includePastDue &&
    pastDue &&
    contactsFilter &&
    contactsFilter.messageStatus === "needsMessage"
  ) {
    return [];
  }

  let query = r.knex("campaign_contact");
  if (assignment) {
    query = query.where({
      assignment_id: assignment.id
    });

    let assignmentLoadLimit = getConfig("ASSIGNMENT_LOAD_LIMIT");
    if (assignmentLoadLimit) {
      assignmentLoadLimit = parseInt(assignmentLoadLimit);
      if (!isNaN(assignmentLoadLimit)) {
        query.limit(assignmentLoadLimit);
      }
    }
  }

  if (contactsFilter) {
    if (contactsFilter.contactId) {
      query = query.where({ id: contactsFilter.contactId });
    } else {
      const validTimezone = contactsFilter.validTimezone;
      if (validTimezone !== null) {
        if (validTimezone === true) {
          query = query.whereIn("timezone_offset", validOffsets);
        } else if (validTimezone === false) {
          query = query.whereIn("timezone_offset", invalidOffsets);
        }
      }

      query = addWhereClauseForContactsFilterMessageStatusIrrespectiveOfPastDue(
        query,
        (contactsFilter && contactsFilter.messageStatus) ||
          (pastDue
            ? // by default if asking for 'send later' contacts we include only those that need replies
              "needsResponse"
            : // we do not want to return closed/messaged
              "needsMessageOrResponse")
      );

      if (Object.prototype.hasOwnProperty.call(contactsFilter, "isOptedOut")) {
        query = query.where("is_opted_out", contactsFilter.isOptedOut);
      }

      if (contactsFilter.errorCode && contactsFilter.errorCode.length) {
        if (contactsFilter.errorCode[0] === 0) {
          query.whereNull("campaign_contact.error_code");
        } else {
          query.whereIn(
            "campaign_contact.error_code",
            contactsFilter.errorCode
          );
        }
      }
    }
  }

  if (!forCount) {
    if (contactsFilter && contactsFilter.messageStatus === "convo") {
      query = query.orderByRaw("message_status DESC, updated_at DESC");
    } else {
      query = query.orderByRaw("message_status DESC, updated_at");
    }
  }

  return query;
}

// Used for Assignment.contactsCount to get a cross-section of timezone/status counts
const filterCount = (assignment, statusFilter, offsetFilter) =>
  Object.keys(assignment.tzStatusCounts) // .entries post-node10.x
    .map(m => ({ status: m, offsets: assignment.tzStatusCounts[m] }))
    .filter(statusFilter)
    .map(({ offsets }) =>
      offsets
        .filter(offsetFilter)
        .map(x => Number(x.count))
        .reduce((a, b) => {
          return a + b;
        }, 0)
    )
    .reduce((a, b) => a + b, 0);

export const resolvers = {
  Assignment: {
    ...mapFieldsToModel(["id", "maxContacts"], Assignment),
    texter: async (assignment, _, { loaders, user }) => {
      if (assignment.texter) {
        return assignment.texter;
      } else if (assignment.user_id === user.id) {
        // Will use current user's cache if present
        return user;
      } else if (assignment.first_name) {
        return assignment;
      } else {
        return await loaders.user.load(assignment.user_id);
      }
    },
    campaign: async (assignment, _, { loaders }) =>
      loaders.campaign.load(assignment.campaign_id),
    hasUnassignedContactsForTexter: async (
      assignment,
      _,
      { loaders, user }
    ) => {
      if (assignment.hasOwnProperty("hasUnassignedContactsForTexter")) {
        return assignment.hasUnassignedContactsForTexter;
      }
      const campaign = await loaders.campaign.load(assignment.campaign_id);
      if (campaign.is_archived) {
        return 0;
      }

      const organization = await loaders.organization.load(
        campaign.organization_id
      );

      const policies = getDynamicAssignmentBatchPolicies({
        organization,
        campaign
      });
      if (!policies.length || !policies[0].requestNewBatchCount) {
        return 0; // to be safe, default to never
      }
      // default is finished-replies
      const availableCount = await policies[0].requestNewBatchCount({
        r,
        loaders,
        cacheableData,
        organization,
        campaign,
        assignment,
        texter: user,
        hasAny: true
      });
      const suggestedCount = Math.min(
        assignment.max_contacts || campaign.batch_size,
        campaign.batch_size,
        availableCount
      );
      return suggestedCount;
    },
    contactsCount: async (
      assignment,
      { contactsFilter, hasAny },
      { loaders },
      apolloRequestContext
    ) => {
      if (
        apolloRequestContext &&
        apolloRequestContext.path &&
        apolloRequestContext.path.key &&
        assignment[apolloRequestContext.path.key.toLowerCase()]
      ) {
        return assignment[apolloRequestContext.path.key.toLowerCase()];
      }
      if (assignment.contacts_count) {
        if (!contactsFilter || Object.keys(contactsFilter).length === 0) {
          return assignment.contacts_count;
        } else if (
          assignment.needs_message_count &&
          contactsFilter.messageStatus === "needsMessage" &&
          Object.keys(contactsFilter).length === 1
        ) {
          return assignment.needs_message_count;
        }
      }
      const campaign = await loaders.campaign.load(assignment.campaign_id);
      const organization = await loaders.organization.load(
        campaign.organization_id
      );
      if (assignment.tzStatusCounts) {
        // TODO: when there is no contacts filter
        if (
          contactsFilter &&
          contactsFilter.messageStatus &&
          !assignment.tzStatusCounts[contactsFilter.messageStatus]
        ) {
          return 0; // that was easy
        }
        const { validOffsets, invalidOffsets } = getCampaignOffsets(
          campaign,
          organization,
          contactsFilter && contactsFilter.validTimezone
        );
        if (contactsFilter && !contactsFilter.messageStatus) {
          // ASSUME: invalidTimezones
          const invalidTzCount = filterCount(
            assignment,
            ({ status }) =>
              status === "needsMessage" || status === "needsResponse",
            offset => invalidOffsets.indexOf(offset.tz) !== -1
          );
          return invalidTzCount;
        }
        // ASSUME: messageStatus with validTimezones
        if (
          contactsFilter &&
          contactsFilter.messageStatus &&
          contactsFilter.validTimezone
        ) {
          const validStatusCount = filterCount(
            assignment,
            ({ status }) => status === contactsFilter.messageStatus,
            offset => validOffsets.indexOf(offset.tz) !== -1
          );
          return validStatusCount;
        } else if (!contactsFilter) {
          return filterCount(
            assignment,
            status => true,
            offset => true
          );
        }
        console.log(
          "assignment.contactsCount tzStatusCounts Data Match Failed",
          hasAny,
          contactsFilter,
          assignment.tzStatusCounts
        );
      }
      if (hasAny) {
        const exists = await getContacts(
          assignment,
          contactsFilter,
          organization,
          campaign,
          true
        )
          .select("campaign_contact.id")
          .first();
        return exists ? 1 : 0;
      } else {
        return await r.getCount(
          getContacts(assignment, contactsFilter, organization, campaign, true)
        );
      }
    },
    contacts: async (assignment, { contactsFilter }, { loaders }) => {
      if (assignment.contacts) {
        return assignment.contacts;
      }
      const campaign = await cacheableData.campaign.load(
        assignment.campaign_id
      );

      const organization = await loaders.organization.load(
        campaign.organization_id
      );
      return getContacts(assignment, contactsFilter, organization, campaign);
    },
    campaignCannedResponses: async assignment =>
      await cacheableData.cannedResponse.query({
        userId: "",
        campaignId: assignment.campaign_id
      }),
    userCannedResponses: async assignment =>
      await cacheableData.cannedResponse.query({
        userId: assignment.user_id,
        campaignId: assignment.campaign_id
      }),
    feedback: async assignment => {
      if (!/texter-feedback/.test(getConfig("TEXTER_SIDEBOXES"))) {
        return null;
      }
      const defaultFeedback = {
        isAcknowledged: false,
        message: "",
        issueCounts: {},
        skillCounts: {},
        createdBy: { id: null, name: "" },
        sweepComplete: false
      };

      const assignmentFeedback = assignment.hasOwnProperty("feedback")
        ? assignment
        : await r
            .knex("assignment_feedback")
            .where({ assignment_id: assignment.id })
            .first();
      if (!assignmentFeedback) {
        return defaultFeedback;
      }

      let feedback = assignmentFeedback.feedback;
      try {
        feedback = JSON.parse(feedback);
      } catch (err) {
        // do nothing
      }

      if (
        feedback &&
        !assignmentFeedback.is_acknowledged &&
        !feedback.isAcknowledged
      ) {
        const createdBy = await r
          .knexReadOnly("user")
          .select("id", "first_name", "last_name")
          .where("id", assignmentFeedback.creator_id || feedback.createdBy)
          .first();

        feedback.createdBy = {
          id: createdBy.id,
          name: `${createdBy.first_name} ${createdBy.last_name}`
        };
      } else if (feedback) {
        feedback.createdBy = defaultFeedback.createdBy;
      }
      if (assignmentFeedback.is_acknowledged) {
        feedback.isAcknowledged = true;
      }
      if (assignmentFeedback.complete) {
        feedback.sweepComplete = true;
      }

      return feedback || defaultFeedback;
    }
  }
};
