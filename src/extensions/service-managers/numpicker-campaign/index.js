import { getFeatures } from "../../../server/api/lib/config";
import { r, cacheableData } from "../../../server/models";
import _ from "lodash";

export const name = "numpicker-campaign";

export const metadata = () => ({
  displayName: "Campaign Number Picker",
  description:
    "Allows specific numbers to be chosen for a campaign. If there are multiple numbers, one is picked at random.",
  canSpendMoney: false,
  moneySpendingOperations: [],
  supportsOrgConfig: false,
  supportsCampaignConfig: true
});

export async function onMessageSend({
  message,
  contact,
  organization,
  campaign,
  serviceManagerData
}) {
  console.log(
    "numpicker-campaign.onMessageSend",
    message.id,
    message.user_number,
    serviceManagerData
  );
  if (
    message.user_number ||
    (serviceManagerData && serviceManagerData.user_number)
  ) {
    // This is meant as a fallback -- if another serviceManager already
    // chose a phone number then don't change anything
    return;
  }
  const campaignNumbers = getFeatures(campaign).campaignNumbers || [];
  const selectedPhone = _.sample(campaignNumbers);
  console.log("numpicker-campaign.onMessageSend selectedPhone", selectedPhone);
  // TODO: caching
  // TODO: something better than pure rotation -- maybe with caching we use metrics
  //   based on sad deliveryreports
  if (selectedPhone) {
    return { user_number: selectedPhone };
  } else {
    console.log(
      "numpicker-campaign.onMessageSend none found",
      serviceName,
      organization.id
    );
  }
}

async function _getAvailableNumbers(organization) {
  const serviceName = cacheableData.organization.getMessageService(
    organization
  );
  const availableNumbers = await r
    .knex("owned_phone_number")
    .where({ service: serviceName, organization_id: organization.id })
    .whereNull("allocated_to_id")
    .pluck("phone_number");

  return availableNumbers;
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
    return {};
  } else {
    const availableNumbers = await _getAvailableNumbers(organization);
    const campaignNumbers = getFeatures(campaign).campaignNumbers;

    return {
      data: {
        availableNumbers,
        campaignNumbers
      },
      fullyConfigured: campaignNumbers > 0
    };
  }
}

export async function onCampaignUpdateSignal({
  organization,
  campaign,
  updateData
}) {
  await cacheableData.campaign.setFeatures(campaign.id, {
    campaignNumbers: updateData
  });

  return {
    data: {
      campaignNumbers: updateData,
      availableNumbers: await _getAvailableNumbers(organization)
    },
    fullyConfigured: updateData.length > 0,
    unArchiveable: false
  };
}
