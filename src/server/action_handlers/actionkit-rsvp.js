import request from 'request'
import { r } from '../models'

export const displayName = () => 'ActionKit Event RSVP'

export const available = () => {
  return true
}

const authenticated_base_url = `https://${process.env.AK_USER}:${process.env.AK_PASSWORD}@${process.env.AK_HOSTNAME}/rest/v1/`

const questionRSVPlist = r.knex('question_response')
  .join('campaign_contact', 'question_response.campaign_contact_id', '=', 'campaign_contact.id')
  .where('question_response.value', 'yes')
  .select('campaign_contact.custom_fields.page_id', 'campaign_contact.custom_fields.external_id', 'campaign_contact.event_id')

export const processAction = rsvpList => {
  console.log('question response:', rsvpList);
  let user = rsvpList.campaign_contact
  const userData = {
    event: `${authenticated_base_url}/event/%s%${user.custom_field.event_id}`,
    page: `${authenticated_base_url}/eventsignuppage/%s/%${user.custom_field.page_id}`,
    role: 'attendee',
    status: 'active',
    user: `${authenticated_base_url}/user/%s/$${user.external_id}`
  }
  console.log('user data:', userData );

  return request.post({url:`${authenticated_base_url}/eventsignup`, formData: userData},  function optionalCallback(err, httpResponse, body) {
    if (err) {
      return console.error('event sign up failed:', err);
    }
    console.log('event sign up successful', body);
  })
}


export async function akSync(){
  console.log('this is being hit');
  try {
    var list = await questionRSVPlist
    processAction(list)
  } catch(error) {
    console.error(error);
  }
}
