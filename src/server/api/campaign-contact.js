import { CampaignContact, r, cacheableData } from "../models";
import { mapFieldsToModel } from "./lib/utils";
import { log, getTopMostParent, zipToTimeZone } from "../../lib";

export const resolvers = {
  Location: {
    timezone: zipCode => zipCode || {},
    city: zipCode => zipCode.city || "",
    state: zipCode => zipCode.state || ""
  },
  Timezone: {
    offset: zipCode => zipCode.timezone_offset || null,
    hasDST: zipCode => zipCode.has_dst || null
  },
  CampaignContact: {
    ...mapFieldsToModel(
      [
        "id",
        "firstName",
        "lastName",
        "cell",
        "zip",
        "customFields",
        "assignmentId",
        "external_id"
      ],
      CampaignContact
    ),
    messageStatus: async (campaignContact, _, { loaders }) => {
      if (campaignContact.message_status) {
        return campaignContact.message_status;
      }
      return await cacheableData.campaignContact.getMessageStatus(
        campaignContact.id
      );
    },
    campaign: async (campaignContact, _, { loaders }) =>
      loaders.campaign.load(campaignContact.campaign_id),
    // To get that result to look like what the original code returned
    // without using the outgoing answer_options array field, try this:
    //
    questionResponseValues: async (campaignContact, _, { loaders }) => {
      if (campaignContact.message_status === "needsMessage") {
        return []; // it's the beginning, so there won't be any
      }
      return await cacheableData.questionResponse.query(
        campaignContact.id,
        true // minimalObj: we might need more info one day
      );
    },
    location: async (campaignContact, _, { loaders }) => {
      if (campaignContact.timezone_offset) {
        // couldn't look up the timezone by zip record, so we load it
        // from the campaign_contact directly if it's there
        const [offset, hasDst] = campaignContact.timezone_offset.split("_");
        const loc = {
          timezone_offset: parseInt(offset, 10),
          has_dst: hasDst === "1"
        };
        // From cache
        if (campaignContact.city) {
          loc.city = campaignContact.city;
          loc.state = campaignContact.state || undefined;
        }
        return loc;
      }
      const mainZip = campaignContact.zip.split("-")[0];
      const calculated = zipToTimeZone(mainZip);
      if (calculated) {
        return {
          timezone_offset: calculated[2],
          has_dst: calculated[3] === 1
        };
      }
      return await loaders.zipCode.load(mainZip);
    },
    messages: async campaignContact => {
      if (campaignContact.message_status === "needsMessage") {
        return []; // it's the beginning, so there won't be any
      }

      if ("messages" in campaignContact) {
        return campaignContact.messages;
      }
      console.log(
        "getConversations oh now!!!! a message query",
        campaignContact
      );
      const messages = cacheableData.message.query({
        campaignContactId: campaignContact.id
      });
      return messages;
    },
    optOut: async (campaignContact, _, { loaders }) => {
      let isOptedOut = null;
      if (typeof campaignContact.is_opted_out !== "undefined") {
        isOptedOut = campaignContact.is_opted_out;
      } else {
        console.log(
          "getConversations oh now!!!! an optout query",
          campaignContact
        );
        let organizationId = campaignContact.organization_id;
        if (!organizationId) {
          const campaign = await loaders.campaign.load(
            campaignContact.campaign_id
          );
          organizationId = campaign.organization_id;
        }

        const isOptedOut = await cacheableData.optOut.query({
          cell: campaignContact.cell,
          organizationId
        });
      }
      // fake ID so we don't need to look up existance
      return isOptedOut ? { id: "optout" } : null;
    }
  }
};
