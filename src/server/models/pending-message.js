import thinky from './thinky'
const type = thinky.type
import { requiredString, optionalString, timestamp } from './custom-types'

const PendingMessage = thinky.createModel('pending_message', type.object().schema({
  id: type.string(),
  user_number: requiredString(),
  contact_number: requiredString(),
  assignment_id: requiredString(),
  is_from_contact: type
    .boolean()
    .required()
    .allowNull(false),
  service: requiredString(),
  parent_id: requiredString(),
  parts: type
    .array()
    .schema(type.object())
    .required()
    .default([]),
  part_count: type.number().integer().required(),
  created_at: timestamp()
}).allowExtra(false))

PendingMessage.ensureIndex('parent_id')

export default PendingMessage
