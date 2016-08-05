import thinky from './thinky'
const type = thinky.type
import { requiredString, timestamp } from './custom-types'
import { getDefaultPlan } from '../lib/plans'
const STARTING_CREDIT = 300

const Organization = thinky.createModel('organization', type.object().schema({
  id: type.string(),
  name: requiredString(),
  created_at: timestamp(),
  stripe_id: type.string(),
  currency: type.string().default('usd'),
  plan_id: type.string().default(() => getDefaultPlan('usd').id),
  credit_amount: type.number().integer().default(STARTING_CREDIT)
}).allowExtra(false))

export default Organization

