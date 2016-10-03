import thinky from './thinky'
const type = thinky.type
import { requiredString, optionalString, timestamp } from './custom-types'

const STARTING_CREDIT = 300
const FEATURES = ['threeClick']

const Organization = thinky.createModel('organization', type.object().schema({
  id: type.string(),
  name: requiredString(),
  created_at: timestamp(),
  stripe_id: optionalString(),
  currency: requiredString(),
  plan_id: requiredString(),
  balance_amount: type
    .number()
    .integer()
    .required()
    .default(STARTING_CREDIT),
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
      check_enabled: type
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
      check_enabled: false,
      permitted_hours: [9, 21]
    })
}).allowExtra(false))

export default Organization
