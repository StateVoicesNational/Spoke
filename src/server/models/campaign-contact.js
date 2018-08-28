import thinky from './thinky'
const type = thinky.type
import { requiredString, optionalString, timestamp } from './custom-types'

import Campaign from './campaign'
import Assignment from './assignment'

const CampaignContact = thinky.createModel('campaign_contact', type.object().schema({
  id: type.string(),
  campaign_id: requiredString(),
  assignment_id: optionalString(),
  external_id: optionalString().stopReference(),
  first_name: optionalString(),
  last_name: optionalString(),
  cell: requiredString(),
  zip: optionalString(),
  custom_fields: requiredString().default('{}'),
  created_at: timestamp(),
  updated_at: timestamp(),
  message_status: requiredString()
    .enum([
      'needsMessage',
      'needsResponse',
      'convo',
      'messaged',
      'closed',
      'UPDATING'
    ])
    .default('needsMessage'),
  is_opted_out: type.boolean().default(false),
  timezone_offset: type
    .string()
    .default('')
    .required()
}, {noAutoCreation: true}).allowExtra(false))

CampaignContact.ensureIndex('assignment_id')
CampaignContact.ensureIndex('campaign_id')
CampaignContact.ensureIndex('cell')
CampaignContact.ensureIndex('campaign_assignment', (doc) => [doc('campaign_id'), doc('assignment_id')])
CampaignContact.ensureIndex('assignment_timezone_offset', (doc) => [
  doc('assignment_id'),
  doc('timezone_offset')
])

export default CampaignContact
