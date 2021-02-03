import nexmo from "./nexmo";
import twilio from "./twilio";
import signalwire from "./signalwire";
import fakeservice from "./fakeservice";

import orgCache from "../../server/models/cacheable_queries/organization";

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

const serviceMap = {
  nexmo,
  signalwire,
  twilio,
  fakeservice
};

export const createMessagingService = (organization, friendlyName) => {
  const serviceName = orgCache.getMessageService(organization);
  let service;
  if (serviceName === "twilio") {
    service = twilio;
  } else if (service === "signalwire") {
    service = signalwire;
  }

  if (service) {
    return service.createMessagingService(organization, friendlyName);
  }
  return null;
};

export default serviceMap;
