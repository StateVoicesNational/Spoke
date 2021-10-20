import { TwilioISV } from "./isv";

/// All functions are OPTIONAL EXCEPT metadata() and const name=.
/// DO NOT IMPLEMENT ANYTHING YOU WILL NOT USE -- the existence of a function adds behavior/UI (sometimes costly)

export const name = "twilio-isv";

export const metadata = () => ({
  // set canSpendMoney=true, if this extension can lead to (additional) money being spent
  // if it can, which operations below can trigger money being spent?
  displayName: "Twilio ISV management",
  description:
    "If ISV api access has been enabled on your account, then you can manage/review brands/campaigns/etc",
  canSpendMoney: true,
  moneySpendingOperations: ["onOrganizationUpdateSignal"],
  supportsOrgConfig: true,
  supportsCampaignConfig: false
});

export async function getOrganizationData({ organization, user, loaders }) {
  // MUST NOT RETURN SECRETS!
  const isv = new TwilioISV({ organization });
  const policies = await isv.getPolicies();
  const profiles = await isv.getProfiles();
  const brands = await isv.getBrands();
  const endUsers = await isv.getEndUsers();

  return {
    // data is any JSON-able data that you want to send.
    // This can/should map to the return value if you implement onOrganizationUpdateSignal()
    // which will then get updated data in the Settings component on-save
    data: {
      policies,
      profiles,
      brands,
      endUsers
    },
    // fullyConfigured: null means (more) configuration is optional -- maybe not required to be enabled
    // fullyConfigured: true means it is fully enabled and configured for operation
    // fullyConfigured: false means more configuration is REQUIRED (i.e. manager is necessary and needs more configuration for Spoke campaigns to run)
    fullyConfigured: null
  };
}

export async function onOrganizationServiceVendorSetup({
  organization,
  user,
  serviceName,
  oldConfig,
  newConfig
}) {}

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
