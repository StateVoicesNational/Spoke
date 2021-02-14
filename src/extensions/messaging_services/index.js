import serviceMap from "./service_map";
import orgCache from "../../server/models/cacheable_queries/organization";

export { tryGetFunctionFromService } from "./service_map";

// Each service needs the following api points:
// async sendMessage(message, contact, trx, organization) -> void
// To receive messages from the outside, you will probably need to implement these, as well:
// async handleIncomingMessage(<native message format>) -> saved (new) messagePart.id
// async convertMessagePartsToMessage(messagePartsGroupedByMessage) -> new Message() <unsaved>

// TODO:
// addExpressEndpoints(app) -> void

// For phone number inventory management:
// async buyNumbersInAreaCode(organization, areaCode, limit, opts) -> Count of successfully purchased numbers
// where the `opts` parameter can include service specific options

export const getService = serviceName => serviceMap[serviceName];

export const getServiceFromOrganization = organization =>
  serviceMap[orgCache.getMessageService(organization)];

export const fullyConfigured = async organization => {
  const messagingService = getServiceFromOrganization(organization);
  const fn = messagingService.fullyConfigured;
  if (!fn || typeof fn !== "function") {
    return true;
  }

  return fn();
};

export const createMessagingService = (organization, friendlyName) => {
  const serviceName = orgCache.getMessageService(organization);
  let service;
  if (serviceName === "twilio") {
    service = serviceMap.twilio;
  } else if (service === "signalwire") {
    // service = signalwire;
  }

  if (service) {
    return service.createMessagingService(organization, friendlyName);
  }
  return null;
};

export default serviceMap;
