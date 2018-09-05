import thinky from './thinky'
import { requiredString, timestamp } from './custom-types'

import Campaign from './campaign'
import User from './user'

const type = thinky.type

const Assignment = thinky.createModel('assignment', type.object().schema({
  id: type.string(),
  user_id: requiredString(),
  campaign_id: requiredString(),
  created_at: timestamp(),
  max_contacts: type.integer()
}).allowExtra(false), {noAutoCreation: true})

Assignment.ensureIndex('user_id')
Assignment.ensureIndex('campaign_id')

export default Assignment
