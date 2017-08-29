export const displayName = () => 'ActionKit Event RSVP'

export const available = () => {
  return true
}

const questionRSVPlist = r.knex('question_response')
  .join('campaign_contact', 'question_response.campaign_contact_id', '=', 'campaign_contact.id')
  .select('campaign_contact.page_id', 'campaign_contact.external_id', 'campaign_contact.event_id')
  .where('question_response.value' = 'yes')

export const processAction = questionResponse => {
  let user = questionResponse.campaign_contact
  const userData = {
    event: `/rest/v1/event/%s%${user.event_id}`,
    page: `/rest/v1/eventsignuppage/%s/%${user.page_id}`,
    role: 'attendee',
    status: 'active',
    user: `/rest/v1/user/%s/$${user.external_id}`
  }
  console.log('user data:', userData );
  return userData
}
