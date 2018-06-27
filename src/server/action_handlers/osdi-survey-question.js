import request from 'request'
import { r } from '../models'

// What the user sees as the option
export const displayName = () => 'OSDI survey response'

// The Help text for the user after selecting the action
export const instructions = () => 'Map script question responses to survey question responses in an OSDI-compliant system.'

// return true, if the action is usable and available for the organizationId
// Sometimes this means certain variables/credentials must be setup
// either in environment variables or organization.features json data
// Besides this returning true, "osdi-survey-question" will also need to be added to
// process.env.ACTION_HANDLERS
export async function available(organizationId) {
  // TODO query for osdiEnabled, osdiApiUrl and osdiApiToken here – using graphQL or straight from the db?
  return true
}

// What happens when a texter saves the answer that triggers the action
// This is presumably the meat of the action
export async function processAction(questionResponse, interactionStep, campaignContactId) {
  console.log('processAction called with', questionResponse, interactionStep, campaignContactId)
  // Generally, you want to send action data to the outside world, so you
  // might want the request library loaded above
  const [contact] = await r.knex('campaign_contact')
    .select('*')
    .where('id', campaignContactId)
  console.log('contact is', contact)
  const { custom_fields = {} } = contact
  const customFields = JSON.parse(custom_fields)
  console.log('contact custom fields are', customFields)
  if (customFields) {
    customFields.processed_test_action = 'completed'
  }

  // interactionStep has the 

  // await r.knex('campaign_contact')
  //   .where('id', campaignContactId)
  //   .update('custom_fields', ...customFields)
}
