import thinky from './thinky'
const type = thinky.type
import { requiredString, timestamp } from './custom-types'

const Organization = thinky.createModel('organization', type.object().schema({
  id: type.string(),
  name: requiredString(),
  created_at: timestamp()
}).allowExtra(false))

export default Organization
