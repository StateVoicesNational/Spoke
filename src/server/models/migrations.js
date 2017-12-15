import thinky from './thinky'
const type = thinky.type

const Migrations = thinky.createModel('migrations', type.object().schema({
  id: type.string(),
  completed: type.integer().allowNull(false)
}).allowExtra(false))

export default Migrations
