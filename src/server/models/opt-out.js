import thinky from './thinky'
const type = thinky.type
import { requiredString, timestamp } from './custom-types'

const OptOut = thinky.createModel('opt_out', type.object().schema({
  id: type.string(),
  cell: requiredString(),
  assignment_id: requiredString(),
  organization_id: requiredString(),
  created_at: timestamp()
}).allowExtra(false))

OptOut.ensureIndex('cell')
OptOut.ensureIndex('assignment_id')
OptOut.ensureIndex('organization_id')

export default OptOut
