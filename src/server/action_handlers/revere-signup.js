import request from 'request'
import { r } from '../models'

// What the user sees as the option
export const displayName = () => 'Revere Signup'

const listId = process.env.REVERE_LIST_ID
const mobileFlowId = process.env.REVERE_NEW_SUBSCRIBER_MOBILE_FLOW
const mobileApiKey = process.env.REVERE_MOBILE_API_KEY

// The Help text for the user after selecting the action
export const instructions = () => (
  'This option triggers a new user request to Revere when selected.'
)

export async function available(organizationId) {
  if (listId && process.env.REVERE_MOBILE_API_KEY) {
    return true
  }
}

export async function processAction(questionResponse, interactionStep, campaignContactId) {

   const contactRes = await r.knex('campaign_contact')
      .where('campaign_contact.id', campaignContactId)
      .leftJoin('campaign', 'campaign_contact.campaign_id', 'campaign.id')
      .leftJoin('organization', 'campaign.organization_id', 'organization.id')
      .select('campaign_contact.cell', 'campaign_contact.first_name', 'campaign_contact.last_name')
    const contact = (contactRes.length ? contactRes[0] : {})
    const contactCell = contact.cell.substring(1)

    let options = {
      method: 'POST',
      url: 'https://mobile.reverehq.com/api/v1/messaging/sendContent',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'Authorization': mobileApiKey
      },
      body: {
        msisdns: [`${contactCell}`],
        mobileFlow: `${mobileFlowId}`,
        list: listId
      },
      json: true
    }

    request(options, (error, response, body) => {
      if (error) throw new Error(error);

      if(response.statusCode == 204){
        console.log('user successfully sent to revere api')
      }
    })
}
