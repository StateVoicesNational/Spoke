import thinky from './thinky'
const type = thinky.type
import { requiredString } from './custom-types'

const UserCell = thinky.createModel('user_cell', type.object().schema({
  id: type.string(),
  cell: requiredString(),
  user_id: requiredString(),
  service: type.string()
    .required()
    .enum('nexmo', 'twilio'),
  is_primary: type.boolean()
    .required()
}).allowExtra(false))

UserCell.ensureIndex('user_id')

export default UserCell
