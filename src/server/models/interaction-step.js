import thinky from './thinky'
const type = thinky.type
import { requiredString, optionalString, timestamp } from './custom-types'

const InteractionStep = thinky.createModel('interaction_step', type.object().schema({
  id: type.string(),
  campaign_id: requiredString(),
  question: optionalString(),
  script: optionalString(),
  answer_options: type
    .array()
    .schema({
      interaction_step_id: optionalString(),
      value: optionalString()
    })
    .required()
    .allowNull(false),
  created_at: timestamp()
}).allowExtra(false))

InteractionStep.ensureIndex('campaign_id')

export default InteractionStep
