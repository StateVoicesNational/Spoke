/// All functions are OPTIONAL EXCEPT metadata() and const name=.
/// DO NOT IMPLEMENT ANYTHING YOU WILL NOT USE -- the existence of a function adds behavior/UI (sometimes costly)

export const name = "test-fake-example";

export const metadata = () => ({
  // set canSpendMoney=true, if this extension can lead to (additional) money being spent
  // if it can, which operations below can trigger money being spent?
  displayName: "Test Fake Service Manager Example",
  canSpendMoney: false,
  moneySpendingOperations: ["onCampaignStart"],
  supportsOrgConfig: true,
  supportsCampaignConfig: true
});

export async function onMessageSend({
  message,
  contact,
  organization,
  campaign
}) {}

// maybe also with organization (only looked up if an enabled hook supports onDeliveryReport
export async function onDeliveryReport({
  contactNumber,
  userNumber,
  messageSid,
  service,
  messageServiceSid,
  newStatus,
  errorCode
}) {}

export async function isCampaignReady({
  organization,
  campaign,
  user,
  loaders
}) {
  // if NOT ready, must return object in form of { ready: false, code: "<string>", message: "<message for campaign creator>"}
}

export async function getCampaignData({
  organization,
  campaign,
  user,
  loaders,
  fromCampaignStatsPage
}) {
  // MUST NOT RETURN SECRETS!
  // called both from edit and stats contexts: editMode==true for edit page
  return {
    data: {
      foo: "bar"
    },
    fullyConfigured: true
  };
}

export async function onCampaignUpdateSignal({
  organization,
  campaign,
  user,
  updateData,
  fromCampaignStatsPage
}) {}

export async function onCampaignContactLoad({
  organization,
  campaign,
  ingestResult,
  ingestDataReference,
  finalContactCount,
  deleteOptOutCells
}) {
  console.log(
    "service-managers.test-fake-example.OnCampaignContactLoad 11",
    organization.id,
    campaign.id,
    ingestResult,
    ingestDataReference
  );
}

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

export async function onOrganizationServiceSetup({
  organization,
  user,
  service
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

export async function onCampaignStart({}) {}

export async function onCampaignArchive({}) {}
