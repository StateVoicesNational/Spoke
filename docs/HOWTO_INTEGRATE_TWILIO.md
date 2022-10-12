# Twilio Integration

You will need to create a Twilio account in order to test outgoing and incoming replies and/or to live text with Heroku or AWS. If you need to use Twilio with live keys, do the following to send messages and receive incoming replies:


## Instructions

### Note on Using Heroku or AWS Lambda
> If you are using these instructions for an Heroku instance or AWS Lambda instance, replace references to `<YOUR_APP_URL>` with your actual app url (i.e. examplespokeapp.herokuapp.com ), and skip step 1.

1. If you are using these instructions for development (not Heroku), you can use [ngrok](https://ngrok.com/docs) to allow Twilio to communicate with Spoke. Follow the instructions in [this section](HOWTO_DEVELOPMENT_LOCAL_SETUP.md#ngrok) and use the ngrok external-facing app URL below to replace `<YOUR_APP_URL>`
2. Create a Twilio acccount: https://www.twilio.com/ _If your organization is a non-profit organization, you may also apply for complementary twilio credits at [Twilio.org](https://www.twilio.org/application)_
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
- When using multiple Twilio accounts you will need to change the Inbound Request URL for your messaging service in the Twilio console [step 7 above]. It should look like `https://<YOUR_APP_URL>/twilio/<ORG_ID>` and `https://<YOUR_APP_URL>/twilio-message-report/<ORG_ID>`. The correct URL to use will be displayed on the settings page after you save the Twilio credentials.

## Purchasing Numbers w/ Twilio
- [How to Set up Per Org Number Purchasing](https://moveonorg.github.io/Spoke/#/HOWTO_BUY_NUMBERS_IN_SPOKE?id=how-to-set-up-per-org-number-buying-with-twilio)
- [How to Set up Per Campaign Number Purchasing](https://moveonorg.github.io/Spoke/#/HOWTO_BUY_NUMBERS_IN_SPOKE?id=how-to-set-up-per-campaign-number-buying-with-twilio)
- [Twilio Direct Number Purchasing.](https://moveonorg.github.io/Spoke/#/HOWTO_BUY_NUMBERS_IN_SPOKE?id=how-to-buy-numbers-directly-in-twilio)
