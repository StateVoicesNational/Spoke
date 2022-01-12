import { r } from "../../../server/models";
import { getConfig } from "../../../server/api/lib/config";

export const name = "campaign-cost-calculator";

export const metadata = () => ({
  displayName: "Campaign Cost Calculator",
  description:
    "Displays costs for outbound and inbound messages in campaign states",
  canSpendMoney: false,
  moneySpendingOperations: ["onCampaignStart"],
  supportsOrgConfig: true,
  supportsCampaignConfig: false
});

export async function getCampaignData({
  organization,
  campaign,
  user,
  loaders,
  fromCampaignStatsPage
}) {
  // called both from edit and stats contexts: editMode==true for edit page
  //  if (fromCampaignStatsPage) {
  //    const costs = await r.knex.raw("SELECT SMSCampaignCost(?)", [campaign]);
  //
  //    return {
  //      data: {
  //        costs: costs
  //      }
  //    };
  //  }
}

export async function getOrganizationData({ organization, user, loaders }) {
  const features = getFeatures(organization);
  const {
    calcCampaignOutboundCost = null,
    calcCampaignInboundCost = null,
    calcCampaignCurrency = null
  } = features;

  return {
    data: {
      inboundCost: organization.features.inboundCost,
      outboundCost: organization.features.outboundCost,
      currency: organization.features.currency
    },
    fullyConfigured: null
  };
}

export async function onOrganizationUpdateSignal({
  organization,
  user,
  updateData
}) {
  return {
    data: updateData,
    fullyConfigured: true
  };
}
