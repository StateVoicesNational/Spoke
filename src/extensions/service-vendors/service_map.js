import * as nexmo from "./nexmo";
import * as twilio from "./twilio";
import * as fakeservice from "./fakeservice";
import * as bandwidth from "./bandwidth";
import * as telnyx from './telnyx';
import { getConfig } from "../../server/api/lib/config";

// TODO this should be built dynamically
export const serviceMap = {
  bandwidth,
  nexmo,
  twilio,
  fakeservice,
  telnyx
};

export const addServerEndpoints = (app, adders) => {
  Object.keys(serviceMap).forEach(serviceName => {
    const serviceAddServerEndpoints = exports.tryGetFunctionFromService(
      serviceName,
      "addServerEndpoints"
    );
    if (serviceAddServerEndpoints) {
      serviceAddServerEndpoints(
        (route, ...handlers) => {
          adders.post(app, route, ...handlers);
        },
        (route, ...handlers) => {
          adders.get(app, route, ...handlers);
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

export const internalErrors = {
  "-1": "Spoke failed to send the message (1st attempt).",
  "-2": "Spoke failed to send the message (2nd attempt).",
  "-3": "Spoke failed to send the message (3rd attempt).",
  "-4": "Spoke failed to send the message (4th attempt).",
  "-5": "Spoke failed to send the message and will NOT try again.",
  "-133": "Auto-optout (no error)",
  "-166":
    "Internal: Message blocked due to text match trigger (profanity-tagger)",
  "-167": "Internal: Initial message altered (initialtext-guard)"
};

export const errorDescription = (errorCode, service) => {
  if (internalErrors[errorCode]) {
    return {
      code: errorCode,
      description: internalErrors[errorCode],
      link: null
    };
  } else if (serviceMap[service].errorDescription) {
    return serviceMap[service].errorDescription(errorCode);
  } else {
    return {
      code: errorCode,
      description: "Message Error",
      link: null
    };
  }
};

export default serviceMap;
