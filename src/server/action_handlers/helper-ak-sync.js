import request from 'request'

const akAddUserUrl = process.env.AK_ADD_USER_URL
const akAddPhoneUrl = process.env.AK_ADD_PHONE_URL

export const actionKitSignup = (contact) => {
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
