import nexmo from './nexmo'
import twilio from './twilio'
import fakeservice from './fakeservice'

// Each service needs the following api points:
// async sendMessage(message) -> void
// To receive messages from the outside, you will probably need to implement these, as well:
// async handleIncomingMessage(<native message format>) -> saved (new) messagePart.id
// async convertMessagePartsToMessage(messagePartsGroupedByMessage) -> new Message() <unsaved>

const serviceMap = {
  nexmo,
  twilio,
  fakeservice
}

export default serviceMap
