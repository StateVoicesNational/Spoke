/* eslint-disable no-empty-function */
/* eslint-disable no-unused-vars */
// This is the gvirs-donotsms service manager.

import { gvirsOptoutVoter } from "../../contact-loaders/gvirs/util";
// import { log } from "../../../lib/log";

export const name = "gvirs-donotsms";

export const metadata = () => ({
  displayName: "The 'Do Not SMS' Opt out service manager",
  description: "Used to opt folk out of receiving SMSes",
  canSpendMoney: false,
  moneySpendingOperations: [],
  supportsOrgConfig: true,
  supportsCampaignConfig: true
});

// When a contact is opted out
// Note: this only works with Spoke patch code; see https://github.com/MoveOnOrg/Spoke/issues/2069
// and https://github.com/MoveOnOrg/Spoke/pull/2070
export async function onOptOut({
  organization,
  contact,
  campaign,
  user,
  noReply,
  reason,
  assignmentId
}) {
  const gvirsVoterId = contact.external_id;
  const customFields = JSON.parse(contact.custom_fields || "{}");
  if ("gvirs_phone_number_id" in customFields) {
    const gvirsPhoneNumberId = customFields.gvirs_phone_number_id;
    const returnVal = await gvirsOptoutVoter(
      gvirsPhoneNumberId,
      organization.name
    );
    return returnVal;
  }
  return null;
}
