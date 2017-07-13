import thinky from './thinky'
const type = thinky.type
import { requiredString, optionalString, timestamp } from './custom-types'

const FEATURES = ['threeClick']

const Organization = thinky.createModel('organization', type.object().schema({
  id: type.string(),
  name: requiredString(),
  created_at: timestamp(),
  features: type.string().required().default(''), // should be restricted by FEATURES
  texting_hours_enforced: type
    .boolean()
    .required()
    .default(false),
  texting_hours_start: type.number()
    .integer()
    .required()
    .min(0)
    .max(24)
    .default(9),
  texting_hours_end: type.number()
    .integer()
    .required()
    .min(0)
    .max(24)
    .default(21)
}).allowExtra(false))

export default Organization
