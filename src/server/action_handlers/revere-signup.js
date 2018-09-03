import request from 'request'
import aws from 'aws-sdk'
import { r } from '../models'

const sqs = new aws.SQS()
// What the user sees as the option
export const displayName = () => 'Revere Signup'

const listId = process.env.REVERE_LIST_ID
const defaultMobileFlowId = process.env.REVERE_NEW_SUBSCRIBER_MOBILE_FLOW
const mobileApiKey = process.env.REVERE_MOBILE_API_KEY
const sendContentUrl = process.env.REVERE_API_URL
const akAddUserUrl = process.env.AK_ADD_USER_URL
const akAddPhoneUrl = process.env.AK_ADD_PHONE_URL
const sqsUrl = process.env.REVERE_SQS_URL

// The Help text for the user after selecting the action
export const instructions = () => (
  'This option triggers a new user request to Revere when selected.'
)

export async function available(organizationId) {
  if ((organizationId && listId) && mobileApiKey) {
    return true
  }
  return false
}

const actionKitSignup = (cell, contact) => {
  // Currently we add the user to Revere and Action Kit. When we add them to AK
  // It takes two requests - one to create the user and then a second request
  // to add the phone numnber to the user. We add the user to ActionKit to make sure
  // we keep have a record of their phone number & attach it to a fake email.
  if (akAddUserUrl && akAddPhoneUrl) {
    const userData = {
      email: cell + '-smssubscriber@example.com',
      first_name: contact.first_name,
      last_name: contact.last_name,
      sms_subscribed: true,
      action_mobilesubscribe: true,
      suppress_subscribe: true,
      phone: [contactCell],
      phone_type: 'mobile',
      source: 'spoke-signup'
    }

    request.post({
      url: akAddUserUrl,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json'
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
            phone: contactCell,
            type: 'mobile'
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
  const mobileFlowId = (customFields.revere_signup_flow ? customFields.revere_signup_flow : defaultMobileFlowId)
  const contactCell = contact.cell.substring(1)

  if (sqsUrl) {
    const msg = {
      payload: {
        cell: `${contactCell}`,
        mobile_flow_id: `${mobileFlowId}`,
        source: 'spoke'
      }
    }

    const sqsParams = {
      MessageBody: JSON.stringify(msg),
      QueueUrl: sqsUrl
    }

    sqs.sendMessage(sqsParams, (err, data) => {
      if (err) {
        console.log('Error sending message to queue', err);
      }
      console.log('Sent message to queue with data:', data);
    })
  } else {
    const options = {
      method: 'POST',
      url: sendContentUrl,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Authorization: mobileApiKey
      },
      body: {
        msisdns: [`00${contactCell}`],
        mobileFlow: `${mobileFlowId}`
      },
      json: true
    }

    return request(options, (error, response) => {
      if (error) throw new Error(error)
    })
  }

  actionKitSignup(contactCell, contact)
}
