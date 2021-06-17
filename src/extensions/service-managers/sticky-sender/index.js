// TODO
// 1. get carrierName in from
// 2. can we avoid queries -- what about inserts on-fail?
// 3. Maybe preload onCampaignStart?

/// All functions are OPTIONAL EXCEPT metadata() and const name=.
/// DO NOT IMPLEMENT ANYTHING YOU WILL NOT USE -- the existence of a function adds behavior/UI (sometimes costly)

import { cacheableData } from "../../../server/models";

export const name = "sticky-sender";

export const metadata = () => ({
  // set canSpendMoney=true, if this extension can lead to (additional) money being spent
  // if it can, which operations below can trigger money being spent?
  displayName: "Sticky Sender",
  description:
    "Tracks and maintains the same phone number for a particular contact's phone number.",
  canSpendMoney: false,
  moneySpendingOperations: [],
  supportsOrgConfig: false,
  supportsCampaignConfig: false
});

export async function onMessageSend({
  message,
  contact,
  organization,
  campaign,
  serviceManagerData
}) {
  console.log(
    "sticky-sender.onMessageSend",
    message.id,
    message.user_number,
    serviceManagerData
  );
  if (
    message.user_number ||
    (serviceManagerData && serviceManagerData.user_number)
  ) {
    // If another serviceManager already chose a phone number then don't change anything
    return;
  }
  const serviceName = cacheableData.organization.getMessageService(
    organization
  );

  const organizationContact = await cacheableData.organizationContact.query({
    organizationId: organization.id,
    contactNumber: message.contact_number
  });

  if (organizationContact && organizationContact.user_number) {
    return { user_number: organizationContact.user_number };
  }
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
  if (userNumber && newStatus === "DELIVERED" && !errorCode) {
    const organizationId = organization.id;
    const organizationContact = await cacheableData.organizationContact.query({
      organizationId,
      contactNumber
    });

    const orgContact = {
      organization_id: organizationId,
      contact_number: contactNumber,
      user_number: userNumber,
      service
    };

    if (!organizationContact) {
      await cacheableData.organizationContact.save(orgContact);
    } else if (!organizationContact.user_number) {
      await cacheableData.organizationContact.save(orgContact, {
        update: true
      });
    }
  }
}
