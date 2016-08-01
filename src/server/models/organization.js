import thinky from './thinky'
const type = thinky.type
import { requiredString, timestamp } from './custom-types'

const STARTING_CREDIT = 300

const Organization = thinky.createModel('organization', type.object().schema({
  id: type.string(),
  name: requiredString(),
  created_at: timestamp(),
  stripe_id: type.string(),
  credit_amount: type.number().integer().default(STARTING_CREDIT)
}).allowExtra(false))

Organization.define('currency', 'usd')
Organization.define("pricePerContact", 10)

export default Organization
