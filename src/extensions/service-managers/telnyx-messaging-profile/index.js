import { getConfig, getFeatures } from "../../../server/api/lib/config";
import { cacheableData, r } from "../../../server/models";

export const name = "telnyx-messaging-profile"

export const metadata = () => ({
  displayName: "Telnyx Messaging",
  description: "Add, and edit Telnyx Messaging profiles",
  canSpendMoney: false,
  moneySpendingOperations: [],
  supportsOrgConfig: true,
  supportsCampaignConfig: false
});


export async function onMessageSend({
  message,
  contact,
  organization,
  campaign
}) {
  const { messagingProfileId: messaging_profile_id } = getFeatures(organization).TELNYX
  return {
    messaging_profile_id
  }
}

export async function onOrganizationUpdateSignal({
  organization,
  user,
  updateData
}) {
  let orgChanges = {
    features: getFeatures(organization)
  };

  //TODO: test if this overwrites the features or updates only TELNYX 
  orgChanges.features.TELNYX = updateData;

  // Make DB changes
  await cacheableData.organization.clear(organization.id);
  await r
    .knex("organization")
    .where("id", organization.id)
    .update(orgChanges);

  return {
    data: updateData,
    fullyConfigured: true
  };
}