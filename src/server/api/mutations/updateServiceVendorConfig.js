import { GraphQLError } from "graphql";
import {
  getConfigKey,
  getService,
  tryGetFunctionFromService
} from "../../../extensions/service-vendors";
import { processServiceManagers } from "../../../extensions/service-managers";
import { getConfig } from "../../../server/api/lib/config";
import orgCache from "../../models/cacheable_queries/organization";
import { accessRequired } from "../errors";
import { Organization } from "../../../server/models";

export const updateServiceVendorConfig = async (
  _,
  { organizationId, serviceName, config },
  { user }
) => {
  await accessRequired(user, organizationId, "OWNER");
  const organization = await orgCache.load(organizationId);
  const configuredServiceName = orgCache.getMessageService(organization);
  if (configuredServiceName !== serviceName) {
    throw new GraphQLError(
      `Can't configure ${serviceName}. It's not the configured message service`
    );
  }

  const service = getService(serviceName);
  if (!service) {
    throw new GraphQLError(`${serviceName} is not a valid message service`);
  }

  const serviceConfigFunction = tryGetFunctionFromService(
    serviceName,
    "updateConfig"
  );
  if (!serviceConfigFunction) {
    throw new GraphQLError(`${serviceName} does not support configuration`);
  }

  let configObject;
  try {
    configObject = JSON.parse(config);
  } catch (caught) {
    throw new GraphQLError("Config is not valid JSON");
  }

  const configKey = getConfigKey(serviceName);
  const existingConfig = getConfig(configKey, organization, {
    onlyLocal: true
  });

  let newConfig;
  await processServiceManagers(
    "onOrganizationServiceVendorSetup",
    organization,
    {
      user,
      serviceName,
      oldConfig: existingConfig,
      newConfig: configObject
    }
  );

  try {
    newConfig = await serviceConfigFunction(
      existingConfig,
      configObject,
      organization
    );
  } catch (caught) {
    // eslint-disable-next-line no-console
    console.error(
      `Error updating config for ${serviceName}: ${JSON.stringify(caught)}`
    );
    throw new GraphQLError(caught.message);
  }
  // TODO: put this into a transaction (so read of features record doesn't get clobbered)
  const dbOrganization = await Organization.get(organizationId);
  const features = JSON.parse(dbOrganization.features || "{}");
  const hadMessageServiceConfig = !!features[configKey];
  const newConfigKeys = new Set(Object.keys(newConfig));
  const legacyTwilioConfig =
    serviceName === "twilio" &&
    !hadMessageServiceConfig &&
    Object.keys(features).some(k => newConfigKeys.has(k));

  dbOrganization.features = JSON.stringify({
    ...features,
    ...(!legacyTwilioConfig && { [configKey]: newConfig }),
    ...(legacyTwilioConfig && newConfig)
  });

  await dbOrganization.save();
  await orgCache.clear(organization.id);
  const updatedOrganization = await orgCache.load(organization.id);

  return {
    id: `org${organization.id}-${serviceName}`,
    config: await orgCache.getMessageServiceConfig(updatedOrganization, {
      restrictToOrgFeatures: true,
      obscureSensitiveInformation: true
    })
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
  getServiceConfig(config, organization, options);
};
