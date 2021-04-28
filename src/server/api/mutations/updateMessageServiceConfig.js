import { GraphQLError } from "graphql/error";
import {
  getConfigKey,
  getService,
  tryGetFunctionFromService
} from "../../../extensions/service-vendors";
import { getConfig } from "../../../server/api/lib/config";
import orgCache from "../../models/cacheable_queries/organization";
import { accessRequired } from "../errors";
import { Organization } from "../../../server/models";

export const updateMessageServiceConfig = async (
  _,
  { organizationId, messageServiceName, config },
  { user }
) => {
  await accessRequired(user, organizationId, "OWNER");
  const organization = await orgCache.load(organizationId);
  const configuredMessageServiceName = orgCache.getMessageService(organization);
  if (configuredMessageServiceName !== messageServiceName) {
    throw new GraphQLError(
      `Can't configure ${messageServiceName}. It's not the configured message service`
    );
  }

  const service = getService(messageServiceName);
  if (!service) {
    throw new GraphQLError(
      `${messageServiceName} is not a valid message service`
    );
  }

  const serviceConfigFunction = tryGetFunctionFromService(
    messageServiceName,
    "updateConfig"
  );
  if (!serviceConfigFunction) {
    throw new GraphQLError(
      `${messageServiceName} does not support configuration`
    );
  }

  let configObject;
  try {
    configObject = JSON.parse(config);
  } catch (caught) {
    throw new GraphQLError("Config is not valid JSON");
  }

  const configKey = getConfigKey(messageServiceName);
  const existingConfig = getConfig(configKey, organization, {
    onlyLocal: true
  });

  let newConfig;
  try {
    newConfig = await serviceConfigFunction(existingConfig, configObject);
  } catch (caught) {
    // eslint-disable-next-line no-console
    console.error(
      `Error updating config for ${messageServiceName}: ${JSON.stringify(
        caught
      )}`
    );
    throw new GraphQLError(caught.message);
  }

  const dbOrganization = await Organization.get(organizationId);
  const features = JSON.parse(dbOrganization.features || "{}");
  const hadMessageServiceConfig = !!features[configKey];
  const newConfigKeys = new Set(Object.keys(newConfig));
  const legacyTwilioConfig =
    messageServiceName === "twilio" &&
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

  return orgCache.getMessageServiceConfig(updatedOrganization);
};

export const getMessageServiceConfig = async (
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
