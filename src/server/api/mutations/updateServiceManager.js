import { cacheableData } from "../../../server/models";
import { processServiceManagers } from "../../../extensions/service-managers";
import { accessRequired } from "../errors";

export const updateServiceManager = async (
  _,
  {
    organizationId,
    serviceManagerName,
    updateData,
    campaignId,
    fromCampaignStatsPage
  },
  { user }
) => {
  const organization = await cacheableData.organization.load(organizationId);
  let campaign;
  let result;
  if (campaignId) {
    // FUTURE: maybe with specific metadata, this could be made lower
    // which could be useful in complement to texter-sideboxes
    await accessRequired(user, organizationId, "SUPERVOLUNTEER", true);
    campaign = await cacheableData.campaign.load(campaignId);
    result = await processServiceManagers(
      "onCampaignUpdateSignal",
      organization,
      { organization, campaign, user, updateData, fromCampaignStatsPage },
      serviceManagerName
    );
  } else {
    // organization
    await accessRequired(user, organizationId, "OWNER", true);
    result = await processServiceManagers(
      "onOrganizationUpdateSignal",
      organization,
      { organization, user, updateData },
      serviceManagerName
    );
  }
  return {
    id: `${serviceManagerName}-org${organizationId}-${campaignId || ""}${
      fromCampaignStatsPage ? "stats" : ""
    }`,
    name: serviceManagerName,
    organization,
    campaign,
    // defaults for result to override
    data: null,
    fullyConfigured: null,
    startPolling: null,
    ...result
  };
};
