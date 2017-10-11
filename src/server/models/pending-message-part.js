import thinky from './thinky'
const type = thinky.type
import { requiredString, optionalString, timestamp } from './custom-types'

// this mostly exists because of:
// https://help.nexmo.com/hc/en-us/articles/205704158-Inbound-SMS-concatenation
// Recommended handling is here:
// https://docs.nexmo.com/messaging/sms-api
// Twilio auto-assembles it for us (thank you!), so this isn't an issue for twilio

const PendingMessagePart = thinky.createModel('pending_message_part', type.object().schema({
  id: type.string(),
  service: requiredString(),
  service_id: requiredString().stopReference(),
  parent_id: optionalString().stopReference(),
  service_message: requiredString(), // JSON
  user_number: optionalString(),
  contact_number: requiredString(),
  created_at: timestamp()
}).allowExtra(false))

PendingMessagePart.ensureIndex('parent_id')
PendingMessagePart.ensureIndex('service')

export default PendingMessagePart
