import thinky from './thinky'
const type = thinky.type
import { requiredString, optionalString, timestamp } from './custom-types'

const Migrations = thinky.createModel('migrations', type.object().schema({
  id: type.string(),
  completed: type.integer().allowNull(false)
}).allowExtra(false), {noAutoCreation: true})

export default Migrations
