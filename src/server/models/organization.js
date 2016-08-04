import thinky from './thinky'
const type = thinky.type
import { requiredString, timestamp } from './custom-types'

const STARTING_CREDIT = 300

const Organization = thinky.createModel('organization', type.object().schema({
  id: type.string(),
  name: requiredString(),
  created_at: timestamp(),
  stripe_id: type.string(),
  currency: requiredString().default('usd'),
  plan_id: requiredString().default(() => Plan.getDefaultPlan('usd')),
  credit_amount: type.number().integer().default(STARTING_CREDIT),
}).allowExtra(false))

export default Organization
