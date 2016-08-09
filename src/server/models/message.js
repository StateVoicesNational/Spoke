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
  service_message_id: optionalString(),
  service: optionalString(),
  created_at: timestamp()
}).allowExtra(false))

Message.ensureIndex('assignment_id')
Message.ensureIndex('service_message_id')


export default Message
