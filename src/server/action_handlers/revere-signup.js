import request from 'request'
import { r } from '../models'

// What the user sees as the option
export const displayName = () => 'Revere Signup'

// The Help text for the user after selecting the action
export const instructions = () => (
  'If a user double opt ins, you can create a new user upload request to Revere.'
)

// return true, if the action is usable and available for the organizationId
// Sometimes this means certain variables/credentials must be setup
// either in environment variables or organization.features json data
// Besides this returning true, "test-action" will also need to be added to
// process.env.ACTION_HANDLERS
export async function available(organizationId) {
  if (process.env.REVERE_LIST_ID && process.env.REVERE_MOBILE_API_KEY) {
    return true
  }
}

// What happens when a texter saves the answer that triggers the action
// This is presumably the meat of the action
export async function processAction(questionResponse, interactionStep, campaignContactId) {
  // This is a meta action that updates a variable in the contact record itself.
  // Generally, you want to send action data to the outside world, so you
  // might want the request library loaded above

   const contactRes = await r.knex('campaign_contact')
      .where('campaign_contact.id', campaignContactId)
      .leftJoin('campaign', 'campaign_contact.campaign_id', 'campaign.id')
      .leftJoin('organization', 'campaign.organization_id', 'organization.id')
      .select('campaign_contact.cell', 'campaign_contact.first_name', 'campaign_contact.last_name')
    const contact = (contactRes.length ? contactRes[0] : {})
    const contactCell = contact.cell
    console.log('contact', contactCell.replace("+", "0"))
    
    let options = {
      method: 'POST',
      url: 'https://mobile.reverehq.com/api/v1/messaging/sendContent',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'Authorization': process.env.REVERE_MOBILE_API_KEY
      },
      body: {
        msisdns: [`${contactCell}`],
        modules: [
          {
            type: 'SUBSCRIPTION',
            params:
            {
              listId: process.env.REVERE_LIST_ID,
              optInType: 'doubleOptIn',
              optInMessage: 'Would you like to join my mobile list? Text STOP to end, HELP for info. 4 msg/mo. Msg&Data Rates May Apply.',
              confirmMessage: 'Thanks for joining my list!',
              subscribedMessage: 'Thanks for your support, you\'re already subscribed!'
            }
          },
          {
            type: 'spoke',
            params: {
              `${process.env.REVERE_LIST_ID}`: 'spoke'
            }
          }
        ]
      },
      json: true
    }

    request(options, function (error, response, body) {
      if (error) throw new Error(error);

      console.log(body)
    });

}
