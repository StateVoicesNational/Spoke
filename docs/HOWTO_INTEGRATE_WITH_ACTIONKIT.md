# How to Integrate with Action Kit

## Step One - making sure your variables are set in your production/development deployment environment

- ACTION_HANDLERS should equal "actionkit-rsvp"
- AK_BASEURL should be your base url from your ActionKit account
- AK_SECRET should be your secret from your ActionKit account
    + Refer to ActionKit's [Hashing documentation](https://docs.actionkit.com/docs/manual/developer/hashing.html#actionkit-s-hashing-system) for instructions on where to find your secret

## Step Two - making sure you have the correct data in your contacts list

- In order for ActionKit RSVP Syncing to work with Spoke, we have to make sure we're including the correct information in our CSV upload AND set up the interaction steps correctly in the campaign script.

### Uploading CSVs with the Correct Information
- When you upload a CSV to Spoke, you must make sure you have the following fields filled out for each contact:
  * external_id (the actionkit user_id)
  * event_page
  * event_id
  * cell
  * firstName
  * lastName
- The external_id refers to the actionkit  user.id found in your actionkit database for users
- The event_id refers to the event id found in AK. The easiest way to find this is in the url slug for the event page
- The event_page refers to the page name in action kit. The slug in the url in the AK event page is sometimes unreliable/confusing
- In order for AK event syncing to work, external_id, event_page and event_id need to be correct.

## Step Three - creating a script linked to ActionKit Event Signup

- After uploading your csv to Spoke, you will assign texters and then create an interaction script for your texters.

- In the interaction script, After you fill out the initial Script and Question fields, more options will appear for possible answers for your texters to mark.
- Make an answer option "yes", click the drop down menu under "Answer" be sure to select "ActionKit Event RSVP". When the texter then receives a yes reply from a member, the texter will choose yes, and that yes will be recorded in your database and "sent" to ActionKit for that event. An API request will be made to ActionKit, and you can check your Spoke Server logs to see that API request go out to make ensure it is working.
