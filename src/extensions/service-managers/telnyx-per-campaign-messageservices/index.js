export const name = "telnyx-per-campaign-messageservices";

export const metadata = () => ({
  displayName: "Per-campaign Message Service",
  description:
    "This allows to create a Telnyx Messaging Profile to be used per campaign",
  canSpendMoney: false,
  supportsOrgConfig: false,
  supportsCampaignConfig: false
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