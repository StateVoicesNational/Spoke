import thinky from './thinky'
const type = thinky.type
import { requiredString, optionalString, timestamp } from './custom-types'
const STARTING_CREDIT = 300

const Organization = thinky.createModel('organization', type.object().schema({
  id: type.string(),
  name: requiredString(),
  created_at: timestamp(),
  stripe_id: optionalString(),
  currency: requiredString(),
  plan_id: requiredString(),
  balance_amount: type
    .number()
    .integer()
    .required()
    .default(STARTING_CREDIT)
}).allowExtra(false))

export default Organization
