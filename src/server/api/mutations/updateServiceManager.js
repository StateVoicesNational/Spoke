import { GraphQLError } from "graphql/error";
import { getConfig } from "../../../server/api/lib/config";
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
  let result = {};
  if (campaignId) {
    // FUTURE: maybe with specific metadata, this could be made lower
    // which could be useful in complement to texter-sideboxes
    await accessRequired(user, organizationId, "SUPERVOLUNTEER", true);
    campaign = await cacheableData.campaign.load(campaignId);
    const response = await processServiceManagers(
      "onCampaignUpdateSignal",
      organization,
      { organization, campaign, user, updateData, fromCampaignStatsPage },
      serviceManagerName
    );
    if (response && response.length && response[0]) {
      result = response[0];
    }
  } else {
    // organization
    await accessRequired(user, organizationId, "OWNER", true);
    const response = await processServiceManagers(
      "onOrganizationUpdateSignal",
      organization,
      { organization, user, updateData },
      serviceManagerName
    );
    console.log("updateServiceManager organization", response);
    if (response && response.length && response[0]) {
      result = response[0];
    }
  }
  console.log("updateServiceManager", result);
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
    ...result
  };
};

export const getServiceVendorConfig = async (
  serviceName,
  organization,
  options = {}
) => {
  const getServiceConfig = exports.tryGetFunctionFromService(
    serviceName,
    "getServiceConfig"
  );
  if (!getServiceConfig) {
    return null;
  }
  const configKey = exports.getConfigKey(serviceName);
  const config = getConfig(configKey, organization, {
    onlyLocal: options.restrictToOrgFeatures
  });
  return getServiceConfig(config, organization, options);
};
