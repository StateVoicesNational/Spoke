/// All functions are OPTIONAL EXCEPT metadata() and const name=.
/// DO NOT IMPLEMENT ANYTHING YOU WILL NOT USE -- the existence of a function adds behavior/UI (sometimes costly)

export const name = "van-api-keys-manager";

export const metadata = () => ({
  // set canSpendMoney=true, if this extension can lead to (additional) money being spent
  // if it can, which operations below can trigger money being spent?
  displayName: "VAN setup manager",
  description:
    "Used for testing and demonstrating service-manager capabilities",
  canSpendMoney: false,
  moneySpendingOperations: ["onCampaignStart"],
  supportsOrgConfig: true,
  supportsCampaignConfig: true
});

export async function getOrganizationData({ organization, user, loaders }) {
  // MUST NOT RETURN SECRETS!

  return {
    // data is any JSON-able data that you want to send.
    // This can/should map to the return value if you implement onOrganizationUpdateSignal()
    // which will then get updated data in the Settings component on-save
    data: {},
    // fullyConfigured: null means (more) configuration is optional -- maybe not required to be enabled
    // fullyConfigured: true means it is fully enabled and configured for operation
    // fullyConfigured: false means more configuration is REQUIRED (i.e. manager is necessary and needs more configuration for Spoke campaigns to run)
    fullyConfigured: null
  };
}

export async function onOrganizationUpdateSignal({
  organization,
  user,
  updateData
}) {
  // this is the function that should hit the db
  // call whatever mutation
  // console.log('the acutal data',updateData);
  console.log(updateData);

  return {
    data: updateData,
    fullyConfigured: true
  };
}

// Write new function that takes UpdateSignal's return to call mutation?
// it'd have to be called somehow, why not just write it in this funct?
