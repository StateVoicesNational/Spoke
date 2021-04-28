import * as nexmo from "./nexmo";
import * as twilio from "./twilio";
import * as fakeservice from "./fakeservice";
import { getConfig } from "../../server/api/lib/config";

// TODO this should be built dynamically
const serviceMap = {
  nexmo,
  twilio,
  fakeservice
};

export const addServerEndpoints = (app, adders) => {
  Object.keys(serviceMap).forEach(serviceName => {
    const serviceAddServerEndpoints = exports.tryGetFunctionFromService(
      serviceName,
      "addServerEndpoints"
    );
    if (serviceAddServerEndpoints) {
      serviceAddServerEndpoints(
        (route, handler) => {
          adders.post(app, route, handler);
        },
        (route, handler) => {
          adders.get(app, route, handler);
        }
      );
    }
  });
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

export default serviceMap;
