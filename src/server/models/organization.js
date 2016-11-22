import thinky from './thinky'
const type = thinky.type
import { requiredString, optionalString, timestamp } from './custom-types'

const FEATURES = ['threeClick']

const Organization = thinky.createModel('organization', type.object().schema({
  id: type.string(),
  name: requiredString(),
  created_at: timestamp(),
  features: type
    .array()
    .schema(
      type.string().enum(FEATURES)
    )
    .required()
    .default([]),
  texting_hours_settings: type
    .object()
    .schema({
      is_enforced: type
        .boolean()
        .required(),
      permitted_hours: type.array()
        .schema(
          type.number()
            .integer()
            .min(0)
            .max(24)
        )
        .required()
    })
    .default({
      is_enforced: false,
      permitted_hours: [9, 21]
    })
    .required()
}).allowExtra(false))

export default Organization
