import { accessRequired } from "./errors";
import { mapFieldsToModel } from "./lib/utils";
import { errorDescriptions } from "./lib/twilio";
import { Campaign, JobRequest, r, cacheableData } from "../models";
import { getUsers } from "./user";
import {
  getAvailableIngestMethods,
  getMethodChoiceData
} from "../../integrations/contact-loaders";
import twilio from "./lib/twilio";
import { getConfig } from "./lib/config";

const title = 'lower("campaign"."title")';

export function addCampaignsFilterToQuery(
  queryParam,
  campaignsFilter,
  organizationId
) {
  let query = queryParam;

  if (organizationId) {
    query = query.where("campaign.organization_id", organizationId);
  }

  if (campaignsFilter) {
    const resultSize = campaignsFilter.listSize ? campaignsFilter.listSize : 0;
    const pageSize = campaignsFilter.pageSize ? campaignsFilter.pageSize : 0;

    if ("isArchived" in campaignsFilter) {
      query = query.where("campaign.is_archived", campaignsFilter.isArchived);
    }
    if ("campaignId" in campaignsFilter) {
      query = query.where(
        "campaign.id",
        parseInt(campaignsFilter.campaignId, 10)
      );
    } else if (
      "campaignIds" in campaignsFilter &&
      campaignsFilter.campaignIds.length > 0
    ) {
      query = query.whereIn("campaign.id", campaignsFilter.campaignIds);
    }

    if ("searchString" in campaignsFilter && campaignsFilter.searchString) {
      const searchStringWithPercents = (
        "%" +
        campaignsFilter.searchString +
        "%"
      ).toLocaleLowerCase();
      query = query.andWhere(
        r.knex.raw(`${title} like ?`, [searchStringWithPercents])
      );
    }

    if (resultSize && !pageSize) {
      query = query.limit(resultSize);
    }
    if (resultSize && pageSize) {
      query = query.limit(resultSize).offSet(pageSize);
    }
  }
  return query;
}

export function buildCampaignQuery(
  queryParam,
  organizationId,
  campaignsFilter
) {
  let query = queryParam.from("campaign");

  query = query.leftJoin(
    "campaign_admin",
    "campaign_admin.campaign_id",
    "campaign.id"
  );

  query = addCampaignsFilterToQuery(query, campaignsFilter, organizationId);

  return query;
}

const id = '"campaign"."id"';
const dueDate = '"campaign"."due_by"';

const asc = column => `${column} ASC`;
const desc = column => `${column} DESC`;

const buildOrderByClause = (query, sortBy) => {
  let fragmentArray = undefined;
  switch (sortBy) {
    case "DUE_DATE_ASC":
      fragmentArray = [asc(dueDate), asc(id)];
      break;
    case "DUE_DATE_DESC":
      fragmentArray = [desc(dueDate), asc(id)];
      break;
    case "TITLE":
      fragmentArray = [title];
      break;
    case "TIMEZONE":
      fragmentArray = ['"campaign"."timezone"'];
      break;
    case "ID_DESC":
      fragmentArray = [desc(id)];
      break;
    case "ID_ASC":
    default:
      fragmentArray = [asc(id)];
      break;
  }
  return query.orderByRaw(fragmentArray.join(", "));
};

const buildSelectClause = sortBy => {
  const fragmentArray = [
    "campaign.*",
    "campaign_admin.contacts_count",
    "campaign_admin.ingest_success"
  ];

  if (sortBy === "TITLE") {
    fragmentArray.push(title);
  }

  return r.knex.select(r.knex.raw(fragmentArray.join(", ")));
};

export async function getCampaigns(
  organizationId,
  cursor,
  campaignsFilter,
  sortBy
) {
  let campaignsQuery = buildCampaignQuery(
    buildSelectClause(sortBy),
    organizationId,
    campaignsFilter
  );
  campaignsQuery = buildOrderByClause(campaignsQuery, sortBy);

  if (cursor) {
    campaignsQuery = campaignsQuery.limit(cursor.limit).offset(cursor.offset);
    const campaigns = await campaignsQuery;

    const campaignsCount = await r.getCount(
      buildCampaignQuery(r.knex, organizationId, campaignsFilter)
    );

    const pageInfo = {
      limit: cursor.limit,
      offset: cursor.offset,
      total: campaignsCount
    };
    return {
      campaigns,
      pageInfo
    };
  }

  return campaignsQuery;
}

export const resolvers = {
  JobRequest: {
    ...mapFieldsToModel(
      ["id", "assigned", "status", "jobType", "resultMessage"],
      JobRequest
    )
  },
  CampaignStats: {
    sentMessagesCount: async (campaign, _, { user }) => {
      await accessRequired(
        user,
        campaign.organization_id,
        "SUPERVOLUNTEER",
        true
      );
      return r.getCount(
        r
          .knex("campaign_contact")
          .join("message", "message.campaign_contact_id", "campaign_contact.id")
          .where({
            "campaign_contact.campaign_id": campaign.id,
            "message.is_from_contact": false
          })
      );
    },
    receivedMessagesCount: async (campaign, _, { user }) => {
      await accessRequired(
        user,
        campaign.organization_id,
        "SUPERVOLUNTEER",
        true
      );
      return r.getCount(
        r
          .knex("campaign_contact")
          .join("message", "message.campaign_contact_id", "campaign_contact.id")
          .where({
            "campaign_contact.campaign_id": campaign.id,
            "message.is_from_contact": true
          })
      );
    },
    optOutsCount: async (campaign, _, { user }) => {
      await accessRequired(
        user,
        campaign.organization_id,
        "SUPERVOLUNTEER",
        true
      );
      return await r.getCount(
        r
          .knex("campaign_contact")
          .where({ is_opted_out: true, campaign_id: campaign.id })
      );
    },
    errorCounts: async (campaign, _, { user, loaders }) => {
      await accessRequired(
        user,
        campaign.organization_id,
        "SUPERVOLUNTEER",
        true
      );
      const errorCounts = await r
        .knex("campaign_contact")
        .where("campaign_id", campaign.id)
        .whereNotNull("error_code")
        .select("error_code", r.knex.raw("count(*) as error_count"))
        .groupBy("error_code")
        .orderByRaw("count(*) DESC");
      const organization = loaders.organization.load(campaign.organization_id);
      const isTwilio = getConfig("DEFAULT_SERVICE", organization) === "twilio";
      return errorCounts.map(e => ({
        code: String(e.error_code),
        count: e.error_count,
        description: errorDescriptions[e.error_code] || null,
        link:
          e.error_code > 0 && isTwilio
            ? `https://www.twilio.com/docs/api/errors/${e.error_code}`
            : null
      }));
    }
  },
  CampaignsReturn: {
    __resolveType(obj, context, _) {
      if (Array.isArray(obj)) {
        return "CampaignsList";
      } else if ("campaigns" in obj && "pageInfo" in obj) {
        return "PaginatedCampaigns";
      }
      return null;
    }
  },
  CampaignsList: {
    campaigns: campaigns => {
      return campaigns;
    }
  },
  PaginatedCampaigns: {
    campaigns: queryResult => {
      return queryResult.campaigns;
    },
    pageInfo: queryResult => {
      if ("pageInfo" in queryResult) {
        return queryResult.pageInfo;
      }
      return null;
    }
  },
  Campaign: {
    ...mapFieldsToModel(
      [
        "id",
        "title",
        "description",
        "batchSize",
        "isStarted",
        "isArchived",
        "useDynamicAssignment",
        "introHtml",
        "primaryColor",
        "logoImageUrl",
        "useOwnMessagingService",
        "messageserviceSid",
        "overrideOrganizationTextingHours",
        "textingHoursEnforced",
        "textingHoursStart",
        "textingHoursEnd",
        "timezone"
      ],
      Campaign
    ),
    dueBy: campaign =>
      campaign.due_by instanceof Date || !campaign.due_by
        ? campaign.due_by || null
        : new Date(campaign.due_by),
    joinToken: async (campaign, _, { user }) => {
      await accessRequired(
        user,
        campaign.organization_id,
        "SUPERVOLUNTEER",
        true
      );
      return campaign.join_token;
    },
    organization: async (campaign, _, { loaders }) =>
      campaign.organization ||
      loaders.organization.load(campaign.organization_id),
    pendingJobs: async (campaign, _, { user }) => {
      await accessRequired(
        user,
        campaign.organization_id,
        "SUPERVOLUNTEER",
        true
      );
      return r
        .knex("job_request")
        .where({ campaign_id: campaign.id })
        .orderBy("updated_at", "desc");
    },
    ingestMethodsAvailable: async (campaign, _, { user, loaders }) => {
      try {
        await accessRequired(user, campaign.organization_id, "ADMIN", true);
      } catch (err) {
        return []; // for SUPERVOLUNTEERS
      }
      const organization = await loaders.organization.load(
        campaign.organization_id
      );
      const ingestMethods = await getAvailableIngestMethods(organization, user);
      return Promise.all(
        ingestMethods.map(async ingestMethod => {
          const clientChoiceData = await getMethodChoiceData(
            ingestMethod,
            organization,
            campaign,
            user,
            loaders
          );
          return {
            name: ingestMethod.name,
            displayName: ingestMethod.displayName(),
            clientChoiceData
          };
        })
      );
    },
    ingestMethod: async (campaign, _, { user, loaders }) => {
      try {
        await accessRequired(user, campaign.organization_id, "ADMIN", true);
      } catch (err) {
        return null; // for SUPERVOLUNTEERS
      }
      if (campaign.hasOwnProperty("contacts_count")) {
        return {
          contactsCount: campaign.contacts_count,
          success: campaign.ingest_success || null
        };
      }

      const status =
        campaign.campaignAdmin ||
        (await r
          .knex("campaign_admin")
          .where("campaign_id", campaign.id)
          .first());
      if (!status || !status.ingest_method) {
        return null;
      }
      return {
        name: status.ingest_method,
        success: status.ingest_success,
        result: status.ingest_result,
        reference: status.ingest_data_reference,
        contactsCount: status.contacts_count,
        deletedOptouts: status.deleted_optouts_count,
        deletedDupes: status.duplicate_contacts_count,
        updatedAt: status.updated_at ? new Date(status.updated_at) : null
      };
    },
    completionStats: async campaign => {
      // must be cache-loaded or bust:
      const stats = await cacheableData.campaign.completionStats(campaign.id);
      return {
        // 0 should still diffrentiate from null
        assignedCount: stats.assignedCount > -1 ? stats.assignedCount : null,
        contactsCount: campaign.contactsCount || stats.contactsCount || null,
        errorCount: stats.errorCount || null,
        // messagedCount won't be defined until some messages are sent
        messagedCount: stats.assignedCount ? stats.messagedCount || 0 : null,
        needsResponseCount:
          stats.needsResponseCount > -1 ? stats.needsResponseCount : null
      };
    },
    texters: async (campaign, _, { user }) => {
      await accessRequired(
        user,
        campaign.organization_id,
        "SUPERVOLUNTEER",
        true
      );
      return getUsers(
        campaign.organization_id,
        null,
        { campaignId: campaign.id },
        "ANY"
      );
    },
    assignments: async (campaign, { assignmentsFilter }, { user }) => {
      await accessRequired(
        user,
        campaign.organization_id,
        "SUPERVOLUNTEER",
        true
      );
      let query = r
        .knex("assignment")
        .where("assignment.campaign_id", campaign.id);

      if (assignmentsFilter) {
        if (assignmentsFilter.texterId) {
          query = query.where("user_id", assignmentsFilter.texterId);
        }
        if (assignmentsFilter.stats) {
          const fields = [
            "assignment.id",
            "assignment.user_id",
            "assignment.campaign_id",
            "user.first_name",
            "user.last_name",
            "user_organization.role"
          ];
          query = query
            .join("user", "user.id", "assignment.user_id")
            .join("user_organization", "user_organization.user_id", "user.id")
            .join(
              "campaign_contact",
              "campaign_contact.assignment_id",
              "assignment.id"
            )
            .select(
              ...fields,
              r.knex.raw(
                "SUM(CASE WHEN campaign_contact.message_status = 'needsMessage' THEN 1 ELSE 0 END) as needs_message_count"
              ),
              r.knex.raw("COUNT(*) as contacts_count")
            )
            .groupBy(...fields)
            .havingRaw("count(*) > 0");
        }
      }

      return query;
    },
    interactionSteps: async (campaign, _, { user }) => {
      await accessRequired(user, campaign.organization_id, "TEXTER", true);
      return (
        campaign.interactionSteps ||
        cacheableData.campaign.dbInteractionSteps(campaign.id)
      );
    },
    cannedResponses: async (campaign, { userId }, { user }) => {
      await accessRequired(user, campaign.organization_id, "TEXTER", true);
      return await cacheableData.cannedResponse.query({
        userId: userId || "",
        campaignId: campaign.id
      });
    },
    texterUIConfig: async (campaign, _, { user, loaders }) => {
      await accessRequired(user, campaign.organization_id, "TEXTER", true);
      const organization = await loaders.organization.load(
        campaign.organization_id
      );

      let options =
        getConfig("TEXTER_UI_SETTINGS", campaign, { onlyLocal: true }) || "";
      if (!options) {
        // fallback on organization defaults
        options = getConfig("TEXTER_UI_SETTINGS", organization) || "";
      }
      const sideboxes = getConfig("TEXTER_SIDEBOXES", organization);
      const sideboxChoices = (sideboxes && sideboxes.split(",")) || [];
      return {
        options,
        sideboxChoices
      };
    },
    contacts: async (campaign, _, { user }) => {
      await accessRequired(user, campaign.organization_id, "ADMIN", true);
      // TODO: should we include a limit() since this is only for send-replies
      return r.knex("campaign_contact").where({ campaign_id: campaign.id });
    },
    contactsCount: async (campaign, _, { user }) => {
      await accessRequired(
        user,
        campaign.organization_id,
        "SUPERVOLUNTEER",
        true
      );
      return await r.getCount(
        r.knex("campaign_contact").where({ campaign_id: campaign.id })
      );
    },
    hasUnassignedContactsForTexter: async (campaign, _, { user }) => {
      // This is the same as hasUnassignedContacts, but the access control
      // is different because for TEXTERs it's just for dynamic campaigns
      // but hasUnassignedContacts for admins is for the campaigns list
      await accessRequired(user, campaign.organization_id, "TEXTER", true);
      if (!campaign.use_dynamic_assignment || campaign.is_archived) {
        return false;
      }
      const contacts = await r
        .knex("campaign_contact")
        .select("id")
        .where({ campaign_id: campaign.id, assignment_id: null })
        .limit(1);
      return contacts.length > 0;
    },
    hasUnassignedContacts: async (campaign, _, { user }) => {
      await accessRequired(
        user,
        campaign.organization_id,
        "SUPERVOLUNTEER",
        true
      );
      const stats = await cacheableData.campaign.completionStats(campaign.id);
      if (stats.assignedCount && campaign.contactsCount) {
        return Number(campaign.contactsCount) - Number(stats.assignedCount) > 0;
      }
      const contacts = await r
        .knex("campaign_contact")
        .select("id")
        .where({ campaign_id: campaign.id, assignment_id: null })
        .limit(1);
      return contacts.length > 0;
    },
    hasUnsentInitialMessages: async (campaign, _, { user }) => {
      await accessRequired(
        user,
        campaign.organization_id,
        "SUPERVOLUNTEER",
        true
      );
      const stats = await cacheableData.campaign.completionStats(campaign.id);
      if (stats.messagedCount && campaign.contactsCount) {
        return Number(campaign.contactsCount) - Number(stats.messagedCount) > 0;
      }
      const contacts = await r
        .knex("campaign_contact")
        .select("id")
        .where({
          campaign_id: campaign.id,
          message_status: "needsMessage",
          is_opted_out: false
        })
        .limit(1);
      return contacts.length > 0;
    },
    customFields: async campaign =>
      campaign.customFields ||
      cacheableData.campaign.dbCustomFields(campaign.id),
    stats: async campaign => campaign,
    cacheable: (campaign, _, { user }) => Boolean(r.redis),
    editors: async (campaign, _, { user }) => {
      await accessRequired(
        user,
        campaign.organization_id,
        "SUPERVOLUNTEER",
        true
      );
      if (r.redis) {
        return cacheableData.campaign.currentEditors(campaign, user);
      }
      return "";
    },
    phoneNumbers: async campaign => {
      const phoneNumbers = await twilio.getPhoneNumbersForService(
        campaign.organization,
        campaign.messageservice_sid
      );
      return phoneNumbers.map(phoneNumber => phoneNumber.phoneNumber);
    },
    creator: async (campaign, _, { loaders }) =>
      campaign.creator_id ? loaders.user.load(campaign.creator_id) : null
  }
};
