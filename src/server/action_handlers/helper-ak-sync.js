import request from "request";

const akAddUserUrl = process.env.AK_ADD_USER_URL;
const akAddPhoneUrl = process.env.AK_ADD_PHONE_URL;

export const actionKitSignup = contact => {
  const cell = contact.cell.substring(1);
  // We add the user to ActionKit to make sure we keep have a record of their phone number & attach it to a fake email.
  if (akAddUserUrl && akAddPhoneUrl) {
    const userData = {
      email: cell + "-smssubscriber@example.com",
      first_name: contact.first_name,
      last_name: contact.last_name,
      user_sms_subscribed: "sms_subscribed",
      user_sms_termsandconditions: "sms_termsandconditions",
      user_robodial_termsandconditions: "yes",
      suppress_subscribe: true,
      phone: [cell],
      phone_type: "mobile",
      source: "spoke-signup"
    };

    request.post(
      {
        url: akAddUserUrl,
        headers: {
          accept: "application/json",
          "content-type": "application/json"
        },
        form: userData
      },
      (errorResponse, httpResponse) => {
        if (errorResponse) throw new Error(errorResponse);
        if (httpResponse.statusCode === 201) {
          request.post(
            {
              url: akAddPhoneUrl,
              headers: {
                accept: "application/json",
                "content-type": "application/json"
              },
              form: {
                user: httpResponse.headers.location,
                phone: cell,
                type: "mobile",
                user_sms_subscribed: "sms_subscribed",
                action_mobilesubscribe: "1",
                action_sms_termsandconditions: "sms_termsandconditions",
                user_sms_termsandconditions: "sms_termsandconditions",
                user_robodial_termsandconditions: "yes"
              }
            },
            (phoneError, phoneResponse) => {
              if (phoneError) throw new Error(phoneError);
              if (phoneResponse.statusCode === 201) {
                return;
              }
            }
          );
        }
      }
    );
  } else {
    console.log("No AK Post URLs Configured");
  }
};
