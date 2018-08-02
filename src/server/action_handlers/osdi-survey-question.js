import axios from 'axios'
import { r } from '../models'
/* eslint-disable camelcase */

export const displayName = () => 'OSDI survey response'

export const instructions = () => 'Map script question responses to survey question responses in an OSDI-compliant system. Contacts must be uploaded with an external_id custom field for this action handler to work.'

export async function available(organizationId) {
  const [{ features }] = await r.knex('organization')
  .where({ id: organizationId })
  .select('features')
  const { osdiEnabled, osdiApiUrl, osdiApiToken } = JSON.parse(features)
  const missing = []
  if (!osdiEnabled) missing.push('osdiEnabled')
  if (!osdiApiUrl) missing.push('osdiApiUrl')
  if (!osdiApiToken) missing.push('osdiApiToken')
  if (missing.length > 0) {
    console.log(`osdi-survey-question action handler unavailable because the following fields are false or unset: ${missing.join(', ')}`)
    return false
  }
  return true
}

/*
The following hash table and function provide a caching mechanism for looking up the OSDI question ID associated with a particular interaction step.¹
*/
const externalQuestionMap = {} // TODO I think this may need to live in a different context.
const getexternalQuestionByInteractionStepId = async interactionStepId => {
  const mappedId = externalQuestionMap[interactionStepId]
  if (mappedId) {
    console.log('parent interaction step external question id', mappedId, 'found in map')
    return mappedId
  }
  const [{ external_question }] = await r.knex('interaction_step')
  .select('external_question')
  .where({ id: interactionStepId })
  console.log('parent interaction step external question id', external_question, 'found in db and added to map', external_question)
  if (external_question) externalQuestionMap[interactionStepId] = external_question
  return external_question
}

export async function processAction(questionResponse, interactionStep, campaignContactId) {
  try {
    const [{ features, external_id }] = await r.knex('campaign_contact')
      .where('campaign_contact.id', campaignContactId)
      .leftJoin('campaign', 'campaign_contact.campaign_id', 'campaign.id')
      .leftJoin('organization', 'campaign.organization_id', 'organization.id')
      .select(
        'campaign_contact.external_id as external_id',
        'organization.features as features'
      )
    const missing = []
    const { osdiApiUrl, osdiApiToken } = JSON.parse(features)
    if (!osdiApiUrl) missing.push('osdiApiUrl')
    if (!osdiApiToken) missing.push('osdiApiToken')
    if (!external_id) missing.push('external_id')
    if (missing.length > 0) throw new Error(`Error processing osdi-survey-question handler for campaign contact ${campaignContactId}: fields ${missing.join(', ')} required.`)

    // interactionStep has the response ID, but we need to retrieve the question ID
    const question = await getexternalQuestionByInteractionStepId(interactionStep.parent_interaction_id)
    if (!question) throw new Error('Could not retrieve the mapped OSDI question id.')
    const body = {
      canvass: {
        action_date: (new Date()).toISOString(),
        contact_type: 'spoke',
        success: true
      },
      add_answers: [
        {
          question,
          responses: [interactionStep.external_response]
        }
      ]
    }
    const client = axios.create({ // move this to the global scope, perhaps?
      baseURL: osdiApiUrl,
      headers: { 'OSDI-Api-Token': osdiApiToken }
    })
    client.post(`/people/${external_id}/record_canvass_helper/`, body)
    .then(({ status, statusText }) => {
      console.log('received', status, statusText,
      'for', JSON.stringify(body))
    })
    .catch(({ status, statusText }) => {
      console.error('error', status, statusText,
      'for', JSON.stringify(body))
    })

    // await r.knex('campaign_contact')
    //   .where('id', campaignContactId)
    //   .update('custom_fields', ...customFields)
  } catch (e) {
    console.error(e)
  }
}


/*
¹This is necessary because:
  1) Any given interaction step can be a child of another interaction step (that is, it can have an answer_option property) and can also have children interaction steps (that is, it can have a question property),
  2) in order to hit the OSDI record_canvass_helper, we need both the question and response fields,
  3) an interaction step can have both an externalResponse, representing the response it is mapped to, and an externalQuestion, representing the question it is mapped to (in which case it will also have children)
  4) the current model stores only the externalResponse on the child questions, not their parent question's externalQuestion, and
  5) adding the parent's externalQuestion seemed like it would make the schema too confusing.

Because of all this, we have to look up the externalQuestion on the parent interaction step of the interaction step that triggers this action handler. The work of doing this is abstracted to this function.
Final note: it would be pretty easy to change this in the future if the schema changes – just check for a property (say, parentQuestionExternalId) on the interaction step triggering the action handler and only call this function if it's not there, for backwards-compatibility.
*/
