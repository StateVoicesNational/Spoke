import { mapFieldsToModel } from "./lib/utils";
import { getConfig, getFeatures } from "./lib/config";
import { r, Organization, cacheableData } from "../models";
import { getTags } from "./tag";
import { accessRequired } from "./errors";
import { getCampaigns } from "./campaign";
import { buildUsersQuery } from "./user";
import {
  getAvailableActionHandlers,
  getActionChoiceData
} from "../../integrations/action-handlers";

export const resolvers = {
  Organization: {
    ...mapFieldsToModel(["id", "name"], Organization),
    campaigns: async (
      organization,
      { cursor, campaignsFilter, sortBy },
      { user }
    ) => {
      await accessRequired(user, organization.id, "SUPERVOLUNTEER");
      return getCampaigns(organization.id, cursor, campaignsFilter, sortBy);
    },
    uuid: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, "SUPERVOLUNTEER");
      const result = await r
        .knex("organization")
        .column("uuid")
        .where("id", organization.id);
      return result[0].uuid;
    },
    optOuts: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, "ADMIN");
      return r
        .table("opt_out")
        .getAll(organization.id, { index: "organization_id" });
    },
    people: async (organization, { role, campaignId, sortBy }, { user }) => {
      await accessRequired(user, organization.id, "SUPERVOLUNTEER");
      return buildUsersQuery(organization.id, role, { campaignId }, sortBy);
    },
    tags: async (organization, { group }, { user }) => {
      let groupFilter = group;
      try {
        await accessRequired(user, organization.id, "SUPERVOLUNTEER");
      } catch (err) {
        await accessRequired(user, organization.id, "TEXTER");
        groupFilter = "texter-tags";
      }
      return getTags(organization, groupFilter);
    },
    profileFields: organization =>
      // @todo: standardize on escaped or not once there's an interface.
      typeof getFeatures(organization).profile_fields === "string"
        ? JSON.parse(getFeatures(organization).profile_fields)
        : getFeatures(organization).profile_fields || [],
    availableActions: async (organization, _, { user, loaders }) => {
      await accessRequired(user, organization.id, "SUPERVOLUNTEER");
      const availableHandlers = await getAvailableActionHandlers(
        organization,
        user
      );

      const promises = availableHandlers.map(handler => {
        return getActionChoiceData(handler, organization, user, loaders).then(
          clientChoiceData => {
            return {
              name: handler.name,
              displayName: handler.displayName(),
              instructions: handler.instructions(),
              clientChoiceData
            };
          }
        );
      });

      return Promise.all(promises);
    },
    textingHoursEnforced: organization => organization.texting_hours_enforced,
    optOutMessage: organization =>
      (organization.features &&
      organization.features.indexOf("opt_out_message") !== -1
        ? JSON.parse(organization.features).opt_out_message
        : process.env.OPT_OUT_MESSAGE) ||
      "I'm opting you out of texts immediately. Have a great day.",
    textingHoursStart: organization => organization.texting_hours_start,
    textingHoursEnd: organization => organization.texting_hours_end,
    texterUIConfig: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, "OWNER");
      const options = getConfig("TEXTER_UI_SETTINGS", organization) || null;
      // note this is global, since we need the set that's globally enabled/allowed to choose from
      const sideboxConfig = getConfig("TEXTER_SIDEBOXES");
      const sideboxChoices = (sideboxConfig && sideboxConfig.split(",")) || [];
      return {
        options,
        sideboxChoices
      };
    },
    cacheable: (org, _, { user }) =>
      //quanery logic.  levels are 0, 1, 2
      r.redis ? (getConfig("REDIS_CONTACT_CACHE", org) ? 2 : 1) : 0,
    twilioAccountSid: async (organization, _, { user }) => {
      try {
        await accessRequired(user, organization.id, "OWNER");
        return organization.features.indexOf("TWILIO_ACCOUNT_SID") !== -1
          ? JSON.parse(organization.features).TWILIO_ACCOUNT_SID
          : null;
      } catch (err) {
        return null;
      }
    },
    twilioAuthToken: async (organization, _, { user }) => {
      try {
        await accessRequired(user, organization.id, "OWNER");
        return JSON.parse(organization.features || "{}")
          .TWILIO_AUTH_TOKEN_ENCRYPTED
          ? "<Encrypted>"
          : null;
      } catch (err) {
        return null;
      }
    },
    twilioMessageServiceSid: async (organization, _, { user }) => {
      try {
        await accessRequired(user, organization.id, "OWNER");
        return organization.features.indexOf("TWILIO_MESSAGE_SERVICE_SID") !==
          -1
          ? JSON.parse(organization.features).TWILIO_MESSAGE_SERVICE_SID
          : null;
      } catch (err) {
        return null;
      }
    },
    fullyConfigured: async organization => {
      const serviceName =
        getConfig("service", organization) || getConfig("DEFAULT_SERVICE");
      if (serviceName === "twilio") {
        const {
          authToken,
          accountSid
        } = await cacheableData.organization.getTwilioAuth(organization);
        const messagingServiceSid = await cacheableData.organization.getMessageServiceSid(
          organization
        );
        if (!(authToken && accountSid && messagingServiceSid)) {
          return false;
        }
      }
      return true;
    },
    phoneInventoryEnabled: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, "SUPERVOLUNTEER");
      return getConfig("EXPERIMENTAL_PHONE_INVENTORY", organization, {
        truthy: true
      });
    },
    pendingPhoneNumberJobs: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, "OWNER", true);
      const jobs = await r
        .knex("job_request")
        .where({
          job_type: "buy_phone_numbers",
          organization_id: organization.id
        })
        .orderBy("updated_at", "desc");
      return jobs.map(j => {
        const payload = JSON.parse(j.payload);
        return {
          id: j.id,
          assigned: j.assigned,
          status: j.status,
          resultMessage: j.result_message,
          areaCode: payload.areaCode,
          limit: payload.limit
        };
      });
    },
    phoneNumberCounts: async (organization, _, { user }) => {
      await accessRequired(user, organization.id, "ADMIN");
      if (
        !getConfig("EXPERIMENTAL_PHONE_INVENTORY", organization, {
          truthy: true
        })
      ) {
        throw Error("Twilio inventory management is not enabled");
      }
      const service = getConfig("DEFAULT_SERVICE");
      const counts = await r
        .knex("owned_phone_number")
        .select(
          "area_code",
          r.knex.raw("COUNT(allocated_to) as allocated_count"),
          r.knex.raw(
            "SUM(CASE WHEN allocated_to IS NULL THEN 1 END) as available_count"
          )
        )
        .where({
          service,
          organization_id: organization.id
        })
        .groupBy("area_code");
      return counts.map(row => ({
        areaCode: row.area_code,
        allocatedCount: Number(row.allocated_count),
        availableCount: Number(row.available_count)
      }));
    }
  }
};
