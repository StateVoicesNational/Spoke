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
  if (fromCampaignStatsPage) {
    const outboundUnitCost = getConfig("CAMPAIGN_COST_OUTBOUND");
    const inboundUnitCost = getConfig("CAMPAIGN_COST_INBOUND");
    const currency = getConfig("CAMPAIGN_COST_CURRENCY");
    // defaults in case our results are undefined or 0 (ie. no SMS sent/received)
    let costs = {
      campaignCosts: {
        outboundCost: "$0.00 " + currency,
        inboundCost: "$0.00 " + currency,
        toalCost: "$0.00 " + currency
      }
    };
    await r.knex
      .raw("SELECT SMSCampaignCost(?, ?, ?)", [
        campaign.id,
        outboundUnitCost,
        inboundUnitCost
      ])
      .then(res => {
        costs = res.rows[0].smscampaigncost;
      });

    return {
      data: {
        campaignCosts: {
          outboundCost: "$" + costs.outboundCost + " " + currency,
          inboundCost: "$" + costs.inboundCost + " " + currency,
          totalCost: "$" + costs.totalCost + " " + currency
        }
      }
    };
  }
}
