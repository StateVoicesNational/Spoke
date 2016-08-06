import thinky from './thinky'
const type = thinky.type
import { requiredString, timestamp } from './custom-types'
const STARTING_CREDIT = 300

const Organization = thinky.createModel('organization', type.object().schema({
  id: type.string(),
  name: requiredString(),
  created_at: timestamp(),
  stripe_id: type.string(),
  currency: type.string(), // FIXME make required
  plan_id: type.string(), // FIXME make required
  balance_amount: type.number().integer().default(STARTING_CREDIT) // FIXME make required
}).allowExtra(false))

export default Organization
