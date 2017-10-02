import request from 'request'
import { r } from '../models'

// What the user sees as the option
export const displayName = () => 'Test Action'

// The Help text for the user after selecting the action
export const instructions = () => (
  `
  This action is for testing and as a code-template for new actions.
  `
)

// return true, if the action is usable and available for the organizationId
// Sometimes this means certain variables/credentials must be setup
// either in environment variables or organization.features json data
// Besides this returning true, "test-action" will also need to be added to
// process.env.ACTION_HANDLERS
export async function available(organizationId) {
  return true
}

// What happens when a texter saves the answer that triggers the action
// This is presumably the meat of the action
export async function processAction(questionResponse, interactionStep, campaignContactId) {
  // This is a meta action that updates a variable in the contact record itself.
  // Generally, you want to send action data to the outside world, so you
  // might want the request library loaded above
  const contact = await r.knex('campaign_contact')
    .where('campaign_contact_id', campaignContactId)
  const customFields = JSON.parse(contact.custom_fields || '{}')
  if (customFields) {
    customFields['processed_test_action'] = "completed"
  }
  
  await r.knex('campaign_contact')
    .where('campaign_contact_id', campaignContactId)
    .update('custom_fields', JSON.stringify(customFields))
}
