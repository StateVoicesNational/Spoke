import thinky from './thinky'
const type = thinky.type
import { requiredString, timestamp, optionalString } from './custom-types'

const User = thinky.createModel('user', type.object().schema({
  id: type.string(),
  auth0_id: requiredString(),
  first_name: requiredString(),
  last_name: requiredString(),
  cell: requiredString(),
  email: requiredString(),
  created_at: timestamp(),
  assigned_cell: optionalString(),
  is_superadmin: type.boolean()
}).allowExtra(false))

export default User
