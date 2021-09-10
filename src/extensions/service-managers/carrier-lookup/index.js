import { r, cacheableData } from "../../../server/models";
import { getService } from "../../service-vendors";

export const name = "carrier-lookup";

export const metadata = () => ({
  // set canSpendMoney=true, if this extension can lead to (additional) money being spent
  // if it can, which operations below can trigger money being spent?
  displayName: "Carrier Lookup",
  description:
    "Gets carrier info of contacts when available from service-vendor",
  canSpendMoney: true,
  moneySpendingOperations: ["onDeliveryReport"],
  // TODO: org config for: just errors, probabilistic sampling percent, on contact-load, always paid (w/names)
  // TODO: org config for: only with campaigns with X prefix
  supportsOrgConfig: false,
  supportsCampaignConfig: false
});

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
  const serviceVendor = getService(service);
  const organizationId = organization.id;
  const organizationContact = await cacheableData.organizationContact.query({
    organizationId,
    contactNumber
  });

  if (!organizationContact || !organizationContact.carrier) {
    const orgContact = {
      organization_id: organizationId,
      contact_number: contactNumber
    };

    let contactInfo;
    if (serviceVendor.getFreeContactInfo) {
      contactInfo = await serviceVendor.getFreeContactInfo({
        organization,
        contactNumber,
        messageSid,
        messageServiceSid
      });
      Object.assign(orgContact, contactInfo);
    } else if (serviceVendor.getNonFreeContactInfo) {
      contactInfo = await serviceVendor.getNonFreeContactInfo({
        organization,
        contactNumber,
        messageSid,
        messageServiceSid
      });
      Object.assign(orgContact, contactInfo);
    }

    if (!organizationContact) {
      await cacheableData.organizationContact.save(orgContact);
    } else if (contactInfo) {
      await cacheableData.organizationContact.save(orgContact, {
        update: true
      });
    }
  }
}
