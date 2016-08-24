import thinky from './thinky'
const type = thinky.type
import { requiredString, optionalString, timestamp } from './custom-types'

const Message = thinky.createModel('message', type.object().schema({
  id: type.string(),
  // theoretically the phone number
  // userNumber should stay constant for a
  // texter, but this is not guaranteed
  user_number: requiredString(),
  contact_number: requiredString(),
  is_from_contact: type
    .boolean()
    .required()
    .allowNull(false),
  text: optionalString(),
  assignment_id: requiredString(),
  service: optionalString(),
  send_status: requiredString().enum('QUEUED', 'SENT', 'DELIVERED', 'ERROR'),
  service_messages: type
    .array()
    .schema(type.object())
    .required()
    .default([]),
  created_at: timestamp()
}).allowExtra(false))

Message.ensureIndex('assignment_id')
Message.ensureIndex('send_status')
Message.ensureIndex('user_number')
Message.ensureIndex('contact_number')


export default Message
