import thinky from './thinky'
const type = thinky.type
import { requiredString, timestamp } from './custom-types'

const JobRequest = thinky.createModel('job_request', type.object().schema({
  id: type.string(),
  campaign_id: requiredString(),
  payload: requiredString(),
  queue_name: requiredString(),
  job_type: requiredString(),
  result_message: type.string().default(''),
  locks_queue: type
    .boolean()
    .required()
    .default(false),
  assigned: type
    .boolean()
    .required()
    .default(false),
  status: type
    .number()
    .integer()
    .required()
    .default(0),
  updated_at: timestamp(),
  created_at: timestamp()
}).allowExtra(false))

JobRequest.ensureIndex('queue_name')

export default JobRequest
