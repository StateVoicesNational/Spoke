# How to Integrate with [Upland Mobile Commons](https://uplandsoftware.com/) (UMC) for Broadcast SMS Signup
- Purpose of this documentation is for organizations who have an Upland Mobile Commons Account. The intended workflow is that you have folks on your peer to peer list who you want to subscribe to your broadcast sms list - and create new profiles.
- We advise you to get some language/workflow approved with your legal team and Upland Mobile Commons before using this feature.

## Step One - Understanding the workflow (for developers and non developers)
- An admin will create a campaign, and in the interaction steps setup, after sending the first message (with approved script from your legal team), will then 'ADD A RESPONSE'. The admin will add 'yes' under 'Answer', click on the drop down and select 'Mobile Commons Signup', and then fill in a script. When a texter then receives an affirmative response for signup, they will click on the drop down menu for 'Current Question' and mark 'yes'. That yes then will create a post request to UMC (and then UMC if you follow those steps below).

### V2: Custom Flows
- To add a custom flow, add the following column to your csv `umc_opt_in_path`
- Visit the flow in Upland Mobile Commons and copy the hash in the url after opt_in_paths - example:
  - URL: https://secure.mcommons.com/campaigns/campaign_id/opt_in_paths/opt_in_path_id
  - Copy id number after `opt_in_paths`
- Paste in CSV for every contact row.
- If you have multiple flows you want to activate in one campaign, make sure the contact row has the opt in path id you want to activate so for example:
```
firstName,lastName,cell,umc_opt_in_path
TestFirstName,TestLastName,2165555555,123abc
TestFirstName2,TestLastName2,3125555555,1234abcd
TestFirstName3,TestLastName3,4435555555,
```
- For the above contact list, TestFirstName would get the flow attached to `123abc`, TestFirstName2 would get the flow attached to `1234abcd`, and TestFirstName3 would get the flow included in the environment configuration for `UMC_OPT_IN_PATH`. In the code, `optInPathId` looks for a `umc_opt_in_path` value, and if it does not find one for the contact, defaults to the configuration environment variable.

## Step Two - Adding the appropriate environment variables (for developers)
- In order to use this feature, you will have to add four more variables and update another environment variable in your environment variables file or your lambda config or your heroku variables config. The following variables you will need to add:
  - New Variables:
      * UMC_PROFILE_URL = API url for creating profiles (included in API documentation)
      * UMC_USER = user that has privileges to use the API
      * UMC_PW = password for user that has privileges to use the API
      * UMC_OPT_IN_PATH = opt in path id to default to if none is included in the CSV
  - Updated Variable:
      ACTION_HANDLERS='mobilecommons-signup'
      * Note - if you currently have a variable set here, i.e. 'actionkit-rsvp', then it will look like the following
        - ACTION_HANDLERS='actionkit-rsvp,revere-signup,mobilecommons-signup'
  - If you want to convey custom fields or the external id, then set UMC_FIELDS.
    This is a comma-separated list of fields that should be passed through to MobileCommons and end with a `:<name of external_id>` if desired.  For instance, if you want to pass through custom fields `state` and `congressional_district` and
    the external_id should be called `org_id`, then you would set UMC_FIELDS=`state,congressional_district:org_id`.

## Additional Steps To Add New Mobile Commons Users to Action Kit
- If you have an account with Action Kit and want to add the new user to Mobile Commons and Action Kit (without adding them to your email subscribed list), you can add two more environment variables (in addition to variables set in step two).
  - AK_ADD_USER_URL = 'https://{admin_account_email}:{admin_account_pw}@act.moveon.org/rest/v1/user/'
  - AK_ADD_PHONE_URL = 'https://{admin_account_email}:{admin_account_pw}@act.moveon.org/rest/v1/phone/'
  - This will create a new user in Action Kit and update their phone number. The default email will be '15555555555-smssubscriber@example.com'  (with 555.. being the actual phone number). They will not be subscribed to your email list and will have their real phone number, first name and last name attached to the account.
