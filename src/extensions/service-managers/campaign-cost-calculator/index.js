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
  // only display costs on the campaign stats page
  if (fromCampaignStatsPage) {
    const outboundUnitCost = getConfig("CAMPAIGN_COST_OUTBOUND", null, {
      default: 0.0
    });
    const inboundUnitCost = getConfig("CAMPAIGN_COST_INBOUND", null, {
      default: 0.0
    });
    const currency = getConfig("CAMPAIGN_COST_CURRENCY", null, {
      default: "UND"
    });
    const error = currency !== "UND" ? false : true;

    let costs = {
      outboundCost: "$0.00 " + currency,
      inboundCost: "$0.00 " + currency,
      toalCost: "$0.00 " + currency
    };

    if (!error) {
      await r.knex
        .raw("SELECT SMSCampaignCost(?, ?, ?)", [
          campaign.id,
          outboundUnitCost,
          inboundUnitCost
        ])
        .then(res => {
          costs = res.rows[0].smscampaigncost;
        });
    }

    return {
      data: {
        campaignCosts: {
          outboundCost: "$" + costs.outboundcost + " " + currency,
          inboundCost: "$" + costs.inboundcost + " " + currency,
          totalCost: "$" + costs.totalcost + " " + currency,
          error
        }
      }
    };
  }
}
