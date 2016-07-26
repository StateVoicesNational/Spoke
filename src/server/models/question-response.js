import thinky from './thinky'
const type = thinky.type
import { requiredString, timestamp } from './custom-types'

const QuestionResponse = thinky.createModel('question_response', type.object().schema({
  id: type.string(),
  campaign_contact_id: requiredString(),
  interaction_step_id: requiredString(),
  value: requiredString(),
  created_at: timestamp()
}).allowExtra(false))

QuestionResponse.ensureIndex('campaign_contact_id')
QuestionResponse.ensureIndex('interaction_step_id')

export default QuestionResponse
