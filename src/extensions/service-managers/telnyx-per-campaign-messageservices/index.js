import { r, cacheableData } from "../../../server/models";
export const name = "telnyx-per-campaign-messageservices";

export const metadata = () => ({
  displayName: "Per-campaign Message Service",
  description:
    "This allows to create a Telnyx Messaging Profile to be used per campaign",
  canSpendMoney: false,
  supportsOrgConfig: false,
  supportsCampaignConfig: true
});

export async function onMessageSend({
  message,
  contact,
  organization,
  campaign
}) {
  if (campaign && campaign.messageservice_sid) {
    return {
      messageservice_sid: campaign.messageservice_sid
    };
  }
}


export async function getCampaignData({
  organization,
  campaign,
  user,
  loaders,
  fromCampaignStatsPage
}) {
  const fullyConfigured = Boolean(campaign.messageservice_sid)
  return {
    data: {
      messageservice_sid: campaign.messageservice_sid,
    },
    fullyConfigured
  }
}

export async function onCampaignUpdateSignal({
  organization,
  campaign,
  user,
  updateData,
  fromCampaignStatsPage
}) {
  await r
    .knex("campaign")
    .where("id", campaign.id)
    .update("messageservice_sid", updateData.messageservice_sid);

  const fullyConfigured = Boolean(campaign.messageservice_sid)
  await cacheableData.campaign.clear(campaign.id);
  return {
    data: {
      messageservice_sid: updateData.messageservice_sid
    },
    fullyConfigured
  };
}
