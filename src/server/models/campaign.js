import thinky from './thinky'
const type = thinky.type
import { requiredString, optionalString, timestamp } from './custom-types'

import Organization from './organization'

const Campaign = thinky.createModel('campaign', type.object().schema({
  id: type.string(),
  organization_id: requiredString(),
  title: optionalString(),
  description: optionalString(),
  is_started: type
    .boolean()
    .required(),
  due_by: type
    .date()
    .required()
    .default(null),
  created_at: timestamp(),
  is_archived: type
    .boolean()
    .required(),
  use_dynamic_assignment: type
    .boolean()
    .required(),
  logo_image_url: type.string(),
  intro_html: type.string(),
  primary_color: type.string()

}).allowExtra(false), {noAutoCreation: true})

Campaign.ensureIndex('organization_id')

export default Campaign
