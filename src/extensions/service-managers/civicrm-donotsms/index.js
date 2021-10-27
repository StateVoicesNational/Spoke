/* eslint-disable no-empty-function */
/* eslint-disable no-unused-vars */
// This is the civicrm-donotsms service manager.

import { optoutContactToGroup } from "../../contact-loaders/civicrm/util";
import { log } from "../../../lib/log";

export const name = "civicrm-donotsms";

export const metadata = () => ({
  displayName: "The 'Do Not SMS' Opt out service manager",
  description: "Used to opt folk out of receiving SMSes",
  canSpendMoney: false,
  moneySpendingOperations: [],
  supportsOrgConfig: true,
  supportsCampaignConfig: true
});

export async function onMessageSend({
  message,
  contact,
  organization,
  campaign
}) {
  log.info("On Message Send");
}

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
}) {
  log.info("onDeliveryReport");
}

// When a contact is opted out
export async function onOptOut({
  organization,
  contact,
  campaign,
  user,
  noReply,
  reason,
  assignmentId
}) {
  log.info(organization);
  log.info(contact);
  log.info(campaign);
  log.info(user);
  log.info(noReply);
  log.info(reason);
  log.info(assignmentId);

  const returnVal = await optoutContactToGroup(contact.externalId);
  return returnVal;
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
  if (fromCampaignStatsPage) {
    return {
      data: {
        foo: "statsPage Info!!!"
      },
      unArchiveable: true
    };
  }
  return {
    data: {
      foo: "bar"
    },
    fullyConfigured: campaign.is_started
  };
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
}) {}

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
  return {
    data: updateData,
    fullyConfigured: true
  };
}

export async function onCampaignStart({ organization, campaign, user }) {}

export async function onCampaignArchive(something = {}) {}

export async function onCampaignUnarchive(something = {}) {
  // you can throw an error to block un-archiving
}
