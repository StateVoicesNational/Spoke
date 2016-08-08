import thinky from './thinky'
const type = thinky.type
import { requiredString, timestamp } from './custom-types'

const BalanceLineItem = thinky.createModel('balance_line_item', type.object().schema({
  id: type.string(),
  currency: requiredString(),
  amount: type.number().integer().required(),
  organization_id: requiredString(),
  created_at: timestamp(),
  message_id: type.string(),
}).allowExtra(false))

export default BalanceLineItem
