/// All functions are OPTIONAL EXCEPT metadata() and const name=.
/// DO NOT IMPLEMENT ANYTHING YOU WILL NOT USE -- the existence of a function adds behavior/UI (sometimes costly)

export const name = "twilio-cost-calculator";

export const metadata = () => ({
  // set canSpendMoney=true, if this extension can lead to (additional) money being spent
  // if it can, which operations below can trigger money being spent?
  displayName: "Twilio Cost Calculator",
  description:
    "Displays campaign costs when using Twilio as your service vendor",
  canSpendMoney: false,
  moneySpendingOperations: ["onCampaignStart"],
  supportsOrgConfig: true,
  supportsCampaignConfig: true
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
    const costs = await r.knex.raw("SELECT SMSCampaignCost(?)", [campaign]);

    return {
      data: {
        costs: costs
      }
    };
  }
}
