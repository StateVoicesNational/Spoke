# How to Integrate with [Revere](https://reverehq.com/) for Broadcast SMS Signup
- Purpose of this documentation is for organizations who have a Revere Mobile Account. The intended workflow is that you have folks on your peer to peer list who you want to subscribe to your broadcast sms list.
- We advise you to get some language/workflow approved with your legal team and Revere before using this feature.

## Step One - Understanding the workflow (for developers and non developers)
- An admin will create a campaign, and in the interaction steps setup, after sending the first message (with approved script from your legal team), will then 'ADD A RESPONSE'. The admin will add 'yes' under 'Answer', click on the drop down and select 'Revere Signup', and then fill in a script. When a texter then receives an affirmative response for signup, they will click on the drop down menu for 'Current Question' and mark 'yes'. That yes then will create a post request to Revere (and then Revere if you follow those steps below).

### V2: Custom Flows
- To add a custom flow, add the following column to your csv `revere_signup_flow`
- Visit the flow in Revere and copy the hash in the url after `/update/`
- Paste in CSV for every contact row.
- If you have multiple flows you want to activate in one campaign, make sure the contact row has the flow you want to trigger so for example:
```
firstName,lastName,cell,revere_signup_flow
TestFirstName,TestLastName,2165555555,123abc
TestFirstName2,TestLastName2,3125555555,1234abcd
TestFirstName3,TestLastName3,4435555555,
```
- For the above contact list, TestFirstName would get the flow attached to `123abc`, TestFirstName2 would get the flow attached to `1234abcd`, and TestFirstName3 would get the flow included in the environment configuration for `REVERE_NEW_SUBSCRIBER_MOBILE_FLOW`. In the code, mobileFlowId looks for a revere_signup_flow value, and if it does not find one for the contact, defaults to the configuration environment variable.

## Step Two - Adding the appropriate environment variables (for developers)
- In order to use this feature, you will have to add three more variables and update another environment variable in your environment variables file or your lambda config or your heroku variables config. The following variables you will need to add:
  - New Variables:
      REVERE_NEW_SUBSCRIBER_MOBILE_FLOW = the hash of the default flow you want to trigger when you send a new user to revere - used also if no flow row is added to the campaign csv.
      REVERE_MOBILE_API_KEY = revere mobile authentication api key
      REVERE_API_URL = revere api endpoint to access to trigger flow
  - Updated Variable:
      ACTION_HANDLERS='revere-signup'
      *Note - if you currently have a variable set here, i.e. 'actionkit-rsvp', then it will look like the following
        - ACTION_HANDLERS='actionkit-rsvp,revere-signup'

## Additional Steps To Add New Revere Users to Action Kit
- If you have an account with Action Kit and want to add the new user to Revere and Action Kit (without adding them to your email subscribed list), you can add two more environment variables (in addition to variables set in step two).
  - AK_ADD_USER_URL = 'https://{admin_account_email}:{admin_account_pw}@act.moveon.org/rest/v1/user/'
  - AK_ADD_PHONE_URL = 'https://{admin_account_email}:{admin_account_pw}@act.moveon.org/rest/v1/phone/'
  - This will create a new user in Action Kit and update their phone number. The default email will be '15555555555-smssubscriber@example.com'  (with 555.. being the actual phone number). They will not be subscribed to your email list and will have their real phone number, first name and last name attached to the account.
