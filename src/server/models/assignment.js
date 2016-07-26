import thinky from './thinky'
import { requiredString, timestamp } from './custom-types'
const type = thinky.type

const Assignment = thinky.createModel('assignment', type.object().schema({
  id: type.string(),
  user_id: requiredString(),
  campaign_id: requiredString(),
  created_at: timestamp()
}).allowExtra(false))

Assignment.ensureIndex('user_id')
Assignment.ensureIndex('campaign_id')

export default Assignment
