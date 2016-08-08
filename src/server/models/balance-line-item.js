import thinky from './thinky'
const type = thinky.type
import { requiredString, optionalString, timestamp } from './custom-types'

const BalanceLineItem = thinky.createModel('balance_line_item', type.object().schema({
  id: type.string(),
  currency: requiredString(),
  amount: type.number().integer().required(),
  organization_id: requiredString(),
  created_at: timestamp(),
  message_id: optionalString(),
}).allowExtra(false))

export default BalanceLineItem
