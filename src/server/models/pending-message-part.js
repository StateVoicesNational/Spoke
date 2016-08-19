import thinky from './thinky'
const type = thinky.type
import { requiredString, timestamp } from './custom-types'

const PendingMessagePart = thinky.createModel('pending_message_part', type.object().schema({
  id: type.string(),
  service: requiredString(),
  parent_id: requiredString(),
  service_message: type.object().required(),
  user_number: requiredString(),
  contact_number: requiredString(),
  created_at: timestamp()
}).allowExtra(false))

PendingMessagePart.ensureIndex('parent_id')

export default PendingMessagePart
