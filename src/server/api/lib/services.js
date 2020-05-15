import nexmo from "./nexmo";
import twilio from "./twilio";
import fakeservice from "./fakeservice";

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
  twilio,
  fakeservice
};

export default serviceMap;
