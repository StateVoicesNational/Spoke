import { GraphQLError } from "graphql/error";
import {
  getConfigKey,
  getService,
  tryGetFunctionFromService
} from "../../../extensions/messaging_services";
import { getConfig } from "../../../server/api/lib/config";
import orgCache from "../../models/cacheable_queries/organization";
import { accessRequired } from "../errors";
import { Organization } from "../../../server/models";

// TODO(lperson) this should allow the message service
// to modify only its own object
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
  const existingConfig = getConfig(configKey, organization);

  let newConfig;
  try {
    newConfig = await serviceConfigFunction(existingConfig, configObject);
  } catch (caught) {
    const message = `Error updating config for ${messageServiceName}: ${caught}`;
    // eslint-disable-next-line no-console
    console.error(message);
    throw new GraphQLError(message);
  }

  const dbOrganization = await Organization.get(organizationId);
  dbOrganization.features = JSON.stringify({
    ...JSON.parse(dbOrganization.features),
    [configKey]: newConfig
  });

  await dbOrganization.save();
  await orgCache.clear(organization.id);
  const updatedOrganization = await orgCache.load(organization.id);

  return orgCache.getMessageServiceConfig(updatedOrganization);
};
