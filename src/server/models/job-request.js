import thinky from './thinky'
const type = thinky.type
import { requiredString, timestamp } from './custom-types'

const JobRequest = thinky.createModel('job_request', type.object().schema({
  id: type.string(),
  payload: type
    .object()
    .required(),
  job_type: requiredString(),
  assigned: type
    .boolean()
    .required()
    .default(false),
  updated_at: timestamp(),
  created_at: timestamp()
}).allowExtra(false))

JobRequest.ensureIndex('unassigned_job', (doc) => [doc('job_type'), doc('assigned')])

export default JobRequest
