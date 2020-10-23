import { r } from "../../models";
import cacheableData from "../../models/cacheable_queries";
import { accessRequired } from "../errors";
import { getConfig } from "../lib/config";
import twilio from "../lib/twilio";
import ownedPhoneNumber from "../lib/owned-phone-number";

export const releaseCampaignNumbers = async (_, { campaignId }, { user }) => {
  const campaign = await cacheableData.campaign.load(campaignId);
  await accessRequired(user, campaign.organization_id, "ADMIN");
  if (!campaign.is_archived) {
    throw new Error("Campaign must me archived to release numbers");
  }
  const organization = await cacheableData.organization.load(
    campaign.organization_id
  );
  const service = getConfig("DEFAULT_SERVICE", organization);
  if (service !== "twilio" && service !== "fakeservice") {
    throw new Error(
      `Campaign phone numbers are not supported for service ${service}`
    );
  }

  if (!campaign.use_own_messaging_service) {
    throw new Error(
      "Campaign is not using its own messaging service, cannot release numbers"
    );
  }
  if (!campaign.messageservice_sid) {
    throw new Error(
      "Campaign no longer has a message service associated with it"
    );
  }

  if (service === "twilio") {
    const shouldRetainServices = getConfig(
      "CAMPAIGN_PHONES_RETAIN_MESSAGING_SERVICES",
      organization,
      { truthy: 1 }
    );

    if (shouldRetainServices) {
      // retain messaging services for analytics, just clear phones
      await twilio.clearMessagingServicePhones(
        organization,
        campaign.messageservice_sid
      );
    } else {
      await twilio.deleteMessagingService(
        organization,
        campaign.messageservice_sid
      );
    }
  }

  await r
    .knex("campaign")
    .where({ id: campaignId })
    .update({ messageservice_sid: null });

  await ownedPhoneNumber.releaseCampaignNumbers(campaignId, r.knex);
  await cacheableData.campaign.clear(campaignId);
  return await cacheableData.campaign.load(campaignId);
};
