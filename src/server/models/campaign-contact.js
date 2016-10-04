import thinky from './thinky'
const type = thinky.type
import { requiredString, optionalString, timestamp } from './custom-types'

const CampaignContact = thinky.createModel('campaign_contact', type.object().schema({
  id: type.string(),
  campaign_id: requiredString(),
  assignment_id: optionalString(),
  first_name: optionalString(),
  last_name: optionalString(),
  cell: requiredString(),
  zip: optionalString(),
  custom_fields: type
    .object()
    .required()
    .allowNull(false)
    .default({}),
  created_at: timestamp(),
  message_status: requiredString()
    .enum([
      'needsMessage',
      'needsResponse',
      'messaged',
      'closed'
    ])
    .default('needsMessage'),
  is_opted_out: type.boolean().default(false),
  timezone_offset: type
    .string()
    .default('')
    // .required()
}).allowExtra(false))

CampaignContact.ensureIndex('assignment_id')
CampaignContact.ensureIndex('campaign_id')
CampaignContact.ensureIndex('cell')
CampaignContact.ensureIndex('campaign_assignment', (doc) => [doc('campaign_id'), doc('assignment_id')])
CampaignContact.ensureIndex('assignment_timezone_offset', (doc) => [
  doc('assignment_id'),
  doc('timezone_offset'),
])

export default CampaignContact
