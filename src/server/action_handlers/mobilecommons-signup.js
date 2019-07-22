import request from 'request'
import aws from 'aws-sdk'
import { r } from '../models'
// What the user sees as the option
export const displayName = () => 'Mobile Commons Signup'

const akAddUserUrl = process.env.AK_ADD_USER_URL
const akAddPhoneUrl = process.env.AK_ADD_PHONE_URL
const createProfileUrl = process.env.UMC_PROFILE_URL
const defaultProfileOptInId = process.env.UMC_OPT_IN_PATH
const umcAuth = 'Basic ' + Buffer.from(process.env.UMC_USER + ':' + process.env.UMC_PW).toString('base64')
const umcConfigured = (defaultProfileOptInId && createProfileUrl)

// The Help text for the user after selecting the action
export const instructions = () => (
  'This option triggers a new user request to Upland Mobile Commons when selected.'
)

export async function available(organizationId) {
  if ((organizationId && listId) && umcConfigured) {
    return true
  }
  return false
}

const actionKitSignup = (contact) => {
  console.log('sending contact to ak-->', contact)
  const cell = contact.cell.substring(1)
 // We add the user to ActionKit to make sure we keep have a record of their phone number & attach it to a fake email.
  if (akAddUserUrl && akAddPhoneUrl) {
    const userData = {
      email: cell + '-smssubscriber@example.com',
      first_name: contact.first_name,
      last_name: contact.last_name,
      sms_subscribed: 'sms_subscribed',
      action_mobilesubscribe: true,
      suppress_subscribe: true,
      phone: [cell],
      phone_type: 'mobile',
      source: 'spoke-signup'
    }

    request.post({
      url: akAddUserUrl,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'Authorization': umcAuth
      },
      form: userData
    }, (errorResponse, httpResponse) => {
      if (errorResponse) throw new Error(errorResponse)
      if (httpResponse.statusCode === 201) {
        request.post({
          url: akAddPhoneUrl,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json'
          },
          form: {
            user: httpResponse.headers.location,
            phone: cell,
            type: 'mobile',
            sms_subscribed: 'sms_subscribed'
          }
        }, (lastError, lastResponse) => {
          if (lastError) throw new Error(lastError)
          if (lastResponse.statusCode === 201) {
            return
          }
        })
      }
    })
  } else {
    console.log('No AK Post URLs Configured')
  }
}

export async function processAction(questionResponse, interactionStep, campaignContactId) {
  const contactRes = await r.knex('campaign_contact')
      .where('campaign_contact.id', campaignContactId)
      .leftJoin('campaign', 'campaign_contact.campaign_id', 'campaign.id')
      .leftJoin('organization', 'campaign.organization_id', 'organization.id')
      .select('campaign_contact.cell', 'campaign_contact.first_name', 'campaign_contact.last_name', 'campaign_contact.custom_fields')

  const contact = (contactRes.length ? contactRes[0] : {})
  const customFields = JSON.parse(contact.custom_fields)
  const optInPathId = (customFields.umc_opt_in_path ? customFields.umc_opt_in_path :  defaultProfileOptInId)
  const cell = contact.cell.substring(1)

  actionKitSignup(contact)

  const options = {
    method: 'POST',
    url: createProfileUrl,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      Authorization: umcAuth
    },
    body: {
      phone_number: cell,
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      opt_in_path_id: optInPathId
    },
    json: true
  }

  return request(options, (error, response) => {
    console.og('response -> ',response)
    if (error) throw new Error(error)
  })

}
