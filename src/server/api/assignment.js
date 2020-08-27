import { mapFieldsToModel } from "./lib/utils";
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
  return query;
}

export function getCampaignOffsets(campaign, organization, timezoneFilter) {
  const textingHoursEnforced = organization.texting_hours_enforced;
  const textingHoursStart = organization.texting_hours_start;
  const textingHoursEnd = organization.texting_hours_end;
  const config = { textingHoursStart, textingHoursEnd, textingHoursEnforced };

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
  const [validOffsets, invalidOffsets] = getOffsets(config);
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

  let query = r.knex("campaign_contact").where({
    assignment_id: assignment.id
  });

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
        texter: user
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
          const invalidTzCount = Object.keys(assignment.tzStatusCounts)
            .map(m => ({ key: m, val: assignment.tzStatusCounts[m] })) // .entries post-node10.x
            .filter(
              ({ key, val }) =>
                key === "needsMessage" || key === "needsResponse"
            )
            .map(({ key, val }) =>
              val
                .filter(x => invalidOffsets.indexOf(x.tz) !== -1)
                .map(x => Number(x.count))
                .reduce((a, b) => {
                  console.log("reduce", a, b);
                  return a + b;
                }, 0)
            )
            .reduce((a, b) => a + b, 0);
          console.log(
            "invalidTimezones",
            invalidTzCount,
            Object.values(assignment.tzStatusCounts).map(arr =>
              arr
                .filter(x => invalidOffsets.indexOf(x.tz) !== -1)
                .map(x => Number(x.count))
                .reduce((a, b) => a + b, 0)
            ),
            assignment.tzStatusCounts
          );
          return invalidTzCount;
        }
        // ASSUME: messageStatus with validTimezones
        if (
          contactsFilter &&
          contactsFilter.messageStatus &&
          contactsFilter.validTimezones
        ) {
          return assignment.tzStatusCounts[contactsFilter.messageStatus]
            .filter(x => validOffsets.indexOf(x.tz) !== -1)
            .map(x => Number(x.count))
            .reduce((a, b) => a + b, 0);
        }
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
      })
  }
};
