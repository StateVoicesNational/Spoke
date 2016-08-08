import thinky from './thinky'
const type = thinky.type
import { requiredString, timestamp } from './custom-types'

const Plan = thinky.createModel('plan', type.object().schema({
  id: type.string(),
  currency: requiredString(),
  amount_per_message: type.number().integer().required(),
  created_at: timestamp(),
  is_default: type.boolean().required()
}).allowExtra(false))

export default Plan
