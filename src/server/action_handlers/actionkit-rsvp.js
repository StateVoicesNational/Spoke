import request from 'request'
import { r } from '../models'
import crypto from 'crypto'

export const displayName = () => 'ActionKit Event RSVP'

export const instructions = () => (
  `
  Campaign contacts MUST be uploaded with "event_id" and "event_page" fields
  along with external_id=<actionkit user.id>.
  Optional fields include "event_source" (defaults to 'spoke') and "event_field_*" fields and "event_action_*"
  which will be added as post data where '*' can be any word which will map to an action/event field.
  `)

export async function available(organizationId) {
  if (process.env.AK_BASEURL && process.env.AK_SECRET) {
    return true
  }
  const org = await r.knex('organization').where('id', organizationId).select('features')
  const features = JSON.parse(org.features || '{}')
  let needed = []
  if (!process.env.AK_BASEURL && !features.AK_BASEURL) {
    needed.push('AK_BASEURL')
  }
  if (!process.env.AK_SECRET && !features.AK_SECRET) {
    needed.push('AK_SECRET')
  }
  if (needed.length) {
    console.error('actionkit-rsvp unavailable because '
                  + needed.join(', ')
                  + ' must be set (either in environment variables or json value for organization)')
  }
  return !!(needed.length)
}

export const akidGenerate = function(ak_secret, cleartext) {
  const shaHash = crypto.createHash()
  shaHash.write(`${ak_secret}.${cleartext}`)
  const shortHash = shahash.digest('base64').slice(0,6)
  return `${cleartext}.${shortHash}`
}

export async function processAction(questionResponse, interactionStep, campaignContactId) {
  const contact = await r.knex('campaign_contact')
    .where('campaign_contact_id', campaignContactId)
    .leftJoin('campaign', 'campaign_contact.campaign_id', 'campaign.id')
    .leftJoin('organization', 'campaign.organization_id', 'organization.id')
    .select('campaign_contact.custom_fields as custom_fields',
            'campaign_contact.external_id as external_id',
            'organization.features as features')
  if (contact.external_id && contact.custom_fields != '{}') {
    try {
      const customFields = JSON.parse(contact.custom_fields || '{}')
      const features = JSON.parse(contact.features || '{}')
      const actionkitBaseUrl = process.env.AK_BASEURL || features.AK_BASEURL
      const akSecret = process.env.AK_SECRET || features.AK_SECRET

      if (actionkitBaseUrl && customFields.event_id && customFields.event_page) {
        const userData = {
          event_id: customFields.event_id,
          page: customFields.event_page,
          role: 'attendee',
          status: 'active',
          akid: akidGenerate(akSecret, contact.external_id),
          event_signup_ground_rules: '1',
          source: customFields.event_source || 'spoke'
        }
        for (let field in customFields) {
          if (field.startsWith('event_field_')) {
            userData['event_' + field.slice('event_field_'.length)] = customFields[field]
          } else if (field.startsWith('event_action_')) {
            userData[field.slice('event_'.length)] = customFields[field]
          }
        }
        request.post({
          'url': `${actionkitBaseUrl}/rest/v1/act/`,
          'form': userData
        }, function (err, httpResponse, body) {
          // TODO: should we save the action id somewhere?
          if (err) {
            console.error('actionkit event sign up failed', err, userData)
          } else {
            console.info('actionkit event sign up SUCCESS!', userData, httpResponse, body)
          }
        })
      }
    } catch(err) {
      console.error('Processing Actionkit RSVP action failed on custom field parsing', campaignContactId, err)
    }
  }
}

