/* eslint-disable no-empty-function */
/* eslint-disable no-unused-vars */
// This is the civicrm-donotsms service manager.

import { optoutContactToGroup } from "../../contact-loaders/civicrm/util";
// import { log } from "../../../lib/log";

export const name = "civicrm-donotsms";

export const metadata = () => ({
  displayName: "The 'Do Not SMS' Opt out service manager",
  description: "Used to opt folk out of receiving SMSes",
  canSpendMoney: false,
  moneySpendingOperations: [],
  supportsOrgConfig: true,
  supportsCampaignConfig: true
});

// When a contact is opted out
// ! This is not currently functional, see https://github.com/MoveOnOrg/Spoke/issues/2069
export async function onOptOut({
  organization,
  contact,
  campaign,
  user,
  noReply,
  reason,
  assignmentId
}) {
  const returnVal = await optoutContactToGroup(contact.external_id);
  return returnVal;
}
