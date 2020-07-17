# Twilio Integration

You will need to create a Twilio account in order to test outgoing and incoming replies and/or to live text with Heroku or AWS. If you need to use Twilio with live keys, do the following to send messages and receive incoming replies:


## Instructions

### Note on Using Heroku or AWS Lambda
> If you are using these instructions for an Heroku instance or AWS Lambda instance, replace references to <YOUR_APP_URL> with your actual app url (i.e. examplespokeapp.herokuapp.com ), and skip step 1.

1. If you are using these instructions for development (not Heroku), you can use [ngrok](https://ngrok.com/docs) to allow Twilio to communicate with Spoke.
  - Create an ngrok account: https://ngrok.com/
  - For a paid ngrok account, a reasonable command line for `ngrok` is `ngrok http -subdomain=<UNIQUE_NAME> 3000` (Replace <UNIQUE_NAME> with something likely to be globally unique. Use the same <UNIQUE_NAME> each time you start ngrok. If you use a different <UNIQUE_NAME> it will be necessary to change the configuration in Twilio and in your .env file.)
  - For a free ngrok account, ngrok can be started with `ngrok http 3000` (Because a free account receives a different, randomly-assigned URL every time ngrok is started, it will be necessary to change the configuration in Twilio and in your .env file each time.)
  - When you start `ngrok`, it will display the external-facing app URL. Use that below to replace <YOUR_APP_URL>
2. Create a Twilio acccount: https://www.twilio.com/ _If your organization is a non-profit organization, you may also apply for complementary twilio credits at [Twilio.org](www.twilio.org/application)_
3. Click on `Programmable SMS` on the side panel
4. Click on `Messaging Services`, and click `Create Messaging Service`
5. Give your messaging service a Name then click `Create`
6. Click on `Properties`
  - `TWILIO_MESSAGE_SERVICE_SID` in your .env file is the `SERVICE SID` displayed in Twilio
7. Click on `Integration`
  - Under Incoming Messages:
    - Make sure `SEND A WEBHOOK` is selected
    - `REQUEST URL` is `https://<YOUR_APP_URL>/twilio` using `HTTP POST`
    - Set `FALLBACK URL` to the same as `REQUEST URL`
  - Under `Outbound Settings`
    - `STATUS CALLBACK URL` in your Twilio console is `https://<YOUR_APP_URL>/twilio-message-report`
    - In your .env file, set `TWILIO_STATUS_CALLBACK_URL` to this same URL
8. Click `Save`, and then visit the [dashboard](https://www.twilio.com/console)
9. Under `Project Info`
  - `TWILIO_ACCOUNT_SID` in your .env file is `ACCOUNT SID` in your Twilio console
  - `TWILIO_AUTH_TOKEN` in your .env file is `AUTH TOKEN` in your Twilio console
10. `DEFAULT_SERVICE` in your .env file is `twilio`
11. If you want to send live text messages as part of your testing, you must buy a phone number and attach it to your project.
  - Click on `Phone Numbers` and press on `+`. Search for a area code and click on buy (trial Twilio accounts give you $15~ to work with). In order to send messages, you will have to connect a credit card with a minimum charge of $20. It is recommended to purchase at least 1 phone numbers per 200 contacts you plan to send to.
  - To attach it to your project, go back to the Messaging Service you created and click `Sender Pool`. Click `Add Sender` and add the phone number you just bought.
  
## Multi-Org Twilio Setup
If you follow the instructions above, every organization and campaign in your instance will use the same Twilio account and the same messaging service (phone number pool). If you want to use different twilio accounts and/or messaging services for each organization, you can basically follow the same instuctions with a couple of tweaks.

- In your .env file, set `TWILIO_MULTI_ORG` to `true`. This will enable an additional section on the organization settings page where you can set Twilio credentials for the organization.
- For security, Twilio Auth Tokens are encrypted using the `SESSION_SECRET` environment variable before being stored in the database.
- You can still set instance-wide credentials in the .env file (as described above). If you do, those credentials will be used as fallback if credentials aren't configured for an organization.
- It is not required to configure all settings for all organizations. For example, to use a single site-wide Twilio account but with separate phone number pools for some organizations, follow the instuctions above and then set the Default Message Service SID (leaving the other fields blank) in the organizations settings for the orgs you want to override.
- When using multiple Twilio accounts you will need to change the Inbound Request URL for your messaging service in the Twilio console [step 7 above]. It should look like `https://<YOUR_APP_URL>/twilio/<ORG_ID>`. The correct URL to use will be displayed on the settings page after you save the Twilio credentials.
