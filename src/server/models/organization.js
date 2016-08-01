import thinky from './thinky'
const type = thinky.type
import { requiredString, timestamp } from './custom-types'

const Organization = thinky.createModel('organization', type.object().schema({
  id: type.string(),
  name: requiredString(),
  created_at: timestamp(),
  stripe_id: type.string(),
  credit_amount: type.number().integer().default(0)
}).allowExtra(false))

export default Organization
