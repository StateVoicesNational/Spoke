/// All functions are OPTIONAL EXCEPT metadata() and const name=.
/// DO NOT IMPLEMENT ANYTHING YOU WILL NOT USE -- the existence of a function adds behavior/UI (sometimes costly)

export const name = "extensions-toggler";

export const metadata = () => ({
  // set canSpendMoney=true, if this extension can lead to (additional) money being spent
  // if it can, which operations below can trigger money being spent?
  displayName: "Extensions Toggle",
  description:
    "Used to turn on or off several an Action Handler, several Message Handlers and a couple Contact Loaders",
  canSpendMoney: false,
  moneySpendingOperations: ["onCampaignStart"],
  supportsOrgConfig: true,
  supportsCampaignConfig: true
});

// Find the Action Handler: TestAction
// Find Message Handlers: Profanity Tagger, Auto Optout, NGPVAN
// Find Contact Loaders: CSV UPload, Fake Data Testing
// Probably located in organization of getOrganizationData

export async function getOrganizationData({ organization, user, loaders }) {
  // MUST NOT RETURN SECRETS!

  return {
    // data is any JSON-able data that you want to send.
    // This can/should map to the return value if you implement onOrganizationUpdateSignal()
    // which will then get updated data in the Settings component on-save
    data: { foo: "bar" },
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
  return {
    data: updateData,
    fullyConfigured: true
  };
}

export async function onCampaignArchive({}) {}

export async function onCampaignUnarchive({}) {
  // you can throw an error to block un-archiving
}
