import thinky from './thinky'
const type = thinky.type
import { requiredString, optionalString, timestamp } from './custom-types'

const UserOrganization = thinky.createModel('user_organization', type.object().schema({
  id: type.string(),
  user_id: requiredString(),
  organization_id: requiredString(),
  roles: type
    .array()
    .schema(type
        .string()
        .enum('ADMIN', 'TEXTER')
      )
    .required()
    .allowNull(false)
}).allowExtra(false))

UserOrganization.ensureIndex('user_id')
UserOrganization.ensureIndex('organization_id')

export default UserOrganization
