import CampaignContactTag from '../../models/campaign-contact-tag'

export async function tagProfaneMessage(campaignContact, message) {

  const campaignContactTag = new CampaignContactTag({
    campaign_contact_id: campaignContact.id,
    tag: 'PROFANITY',
    created_at: new Date(),
    message_id: message.id
  })

  await campaignContactTag.save()
}