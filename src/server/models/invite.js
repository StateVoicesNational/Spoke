import thinky from './thinky'
const type = thinky.type
import { timestamp } from './custom-types'

const Invite = thinky.createModel('invite', type.object().schema({
  id: type.string(),
  is_valid: type
    .boolean()
    .required()
    .allowNull(false),
  created_at: timestamp()
}).allowExtra(false))

Invite.ensureIndex('is_valid')

export default Invite
