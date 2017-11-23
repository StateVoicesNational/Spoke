import thinky from './thinky'
import { requiredString, timestamp } from './custom-types'

const type = thinky.type

const Log = thinky.createModel('log', type.object().schema({
  id: type.string(),
  message_sid: requiredString(),
  body: type.string(),
  created_at: timestamp()
}).allowExtra(false))

export default Log