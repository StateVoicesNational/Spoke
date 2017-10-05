import nexmo from './nexmo'
import twilio from './twilio'

// Each service needs the following api points:
// async sendMessage(message) -> void
// async handleIncomingMessage(<native message format>) -> saved (new) messagePart.id
// async convertMessagePartsToMessage(messagePartsGroupedByMessage) -> new Message() <unsaved>

const serviceMap = {
  nexmo,
  twilio
}

export default serviceMap
