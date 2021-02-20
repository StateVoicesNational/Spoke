import nexmo from "./nexmo";
import * as twilio from "./twilio";
import fakeservice from "./fakeservice";
import { getConfig } from "../../server/api/lib/config";

const serviceMap = {
  nexmo,
  twilio,
  fakeservice
};

export const getConfigKey = serviceName => `message_service_${serviceName}`;

export const getService = serviceName => serviceMap[serviceName];

export const getServiceMetadata = serviceName => {
  const getMetadata = exports.tryGetFunctionFromService(
    serviceName,
    "getMetadata"
  );

  if (!getMetadata) {
    throw new Error(
      `Message service ${serviceName} is missing required method getMetadata!`
    );
  }

  return getMetadata();
};

export const tryGetFunctionFromService = (serviceName, functionName) => {
  const messageService = exports.getService(serviceName);
  if (!messageService) {
    throw new Error(`${serviceName} is not a message service`);
  }
  const fn = messageService[functionName];
  return fn && typeof fn === "function" ? fn : null;
};

export const getMessageServiceConfig = async (serviceName, organization) => {
  const getServiceConfig = exports.tryGetFunctionFromService(
    serviceName,
    "getServiceConfig"
  );
  if (!getServiceConfig) {
    return null;
  }
  const configKey = exports.getConfigKey(serviceName);
  const config = getConfig(configKey, organization);
  return getServiceConfig(config, organization);
};

export default serviceMap;
