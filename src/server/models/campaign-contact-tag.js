import thinky from './thinky'
import { requiredString, timestamp } from './custom-types'
import CampaignContact from './campaign-contact'
import Message from './message'

const type = thinky.type

const CampaignContactTag = thinky.createModel(
  'campaign_contact_tag',
  type
    .object()
    .schema({
      id: type.string(),
      campaign_contact_id: requiredString(),
      tag: requiredString(),
      created_at: timestamp(),
      message_id: type.string().allowNull(true)
    })
    .allowExtra(false),
  { noAutoCreation: true, dependencies: [CampaignContact, Message] }
)

CampaignContactTag.ensureIndex('campaign_contact_id')

export default CampaignContactTag
