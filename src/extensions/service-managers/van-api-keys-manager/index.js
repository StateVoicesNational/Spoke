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

export async function onMessageSend({
  message,
  contact,
  organization,
  campaign
}) {}

// NOTE: this is somewhat expensive relatively what it usually is,
// so only implement this if it's important
export async function onDeliveryReport({
  contactNumber,
  userNumber,
  messageSid,
  service,
  messageServiceSid,
  newStatus,
  errorCode,
  organization,
  campaignContact,
  lookup
}) {}

// When a contact is opted out
export async function onOptOut({
  organization,
  contact,
  campaign,
  user,
  noReply,
  reason,
  assignmentId
}) {}

export async function getCampaignData({
  organization,
  campaign,
  user,
  loaders,
  fromCampaignStatsPage
}) {
  // MUST NOT RETURN SECRETS!
  // called both from edit and stats contexts: editMode==true for edit page
  if (fromCampaignStatsPage) {
    return {
      data: {
        foo: "statsPage Info!!!"
      },
      unArchiveable: true
    };
  } else {
    return {
      data: {
        foo: "hello"
      },
      fullyConfigured: campaign.is_started
    };
  }
}

export async function onCampaignUpdateSignal({
  organization,
  campaign,
  user,
  updateData,
  fromCampaignStatsPage
}) {
  return {
    data: {
      foo: "xyz"
    },
    fullyConfigured: true,
    unArchiveable: false
  };
}

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
    data: { foo: "org hello" },
    // fullyConfigured: null means (more) configuration is optional -- maybe not required to be enabled
    // fullyConfigured: true means it is fully enabled and configured for operation
    // fullyConfigured: false means more configuration is REQUIRED (i.e. manager is necessary and needs more configuration for Spoke campaigns to run)
    fullyConfigured: null
  };
}

export async function onBuyPhoneNumbers({
  organization,
  user,
  serviceName,
  areaCode,
  limit,
  opts
}) {}

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
  // this is the function that should hit the db
  console.log("onOrganizationUpdateSignal");
  console.log(updateData);
  return {
    data: updateData,
    fullyConfigured: true
  };
}

export async function onCampaignStart({ organization, campaign, user }) {
  console.log(
    "service-managers.test-fake-example onCampaignStart",
    campaign.id,
    user.id
  );
}

export async function onCampaignArchive({}) {}

export async function onCampaignUnarchive({}) {
  // you can throw an error to block un-archiving
}
