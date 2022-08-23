import { cacheableData } from "../../../server/models";
import { getFeatures } from "../../../server/api/lib/config";

export const name = "per-campaign-bulk-send";

export const metadata = () => ({
  displayName: "Allow Bulk Send",
  description: "Toggle bulk send per campaign",
  canSpendMoney: false,
  moneySpendingOperations: [],
  supportsOrgConfig: false,
  supportsCampaignConfig: true
});

export async function getCampaignData({ organization, campaign }) {
  return {
    data: {
      perCampaignBulkSend: getFeatures(campaign).perCampaignBulkSend
        ? true
        : false
    },
    fullyConfigured: true
  };
}

export async function onCampaignUpdateSignal({
  organization,
  campaign,
  user,
  updateData
}) {
  await cacheableData.campaign.setFeatures(campaign.id, {
    perCampaignBulkSend: updateData.perCampaignBulkSend
  });
  return {
    data: {
      perCampaignBulkSend: getFeatures(campaign).perCampaignBulkSend
        ? true
        : false
    },
    fullyConfigured: true,
    unArchiveable: false
  };
}
