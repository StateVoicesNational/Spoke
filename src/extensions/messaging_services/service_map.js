import nexmo from "./nexmo";
import * as twilio from "./twilio";
import fakeservice from "./fakeservice";

const serviceMap = {
  nexmo,
  twilio,
  fakeservice
};

export const getConfigKey = serviceName => `message_service_${serviceName}`;

export const getService = serviceName => serviceMap[serviceName];

export const tryGetFunctionFromService = (serviceName, functionName) => {
  const messageService = exports.getService(serviceName);
  if (!messageService) {
    throw new Error(`${serviceName} is not a message service`);
  }
  const fn = messageService[functionName];
  return fn && typeof fn === "function" ? fn : null;
};

export default serviceMap;
