# Twilio Integration

You will need to create a Twilio account in order to test outgoing and incoming replies and/or to live text with Heroku or AWS. If you need to use Twilio with live keys, do the following to send messages and receive incoming replies:


## Instructions

### Note
If you are using these instructions for an Heroku instance or AWS Lambda instance, replace references to <YOUR_NGROK_APP_URL> with your actual app url (i.e. examplespokeapp.herokuapp.com )

1. If you are using these instructions for development, start [ngrok](https://ngrok.com/docs).
  - A reasonable command line for `ngrok` is `ngrok http -subdomain=<UNIQUE_NAME> 3000` (Replace <UNIQUE_NAME> with something likely to be globally unique. Use the same <UNIQUE_NAME> each time you start ngrok. If you use a different <UNIQUE_NAME> it will be necessary to change the configuration in Twilio.)
  - When you start `ngrok`, it will display the external-facing app URL. Use that below to replace <YOUR_NGROK_APP_URL>
2. Create a Twilio acccount: https://www.twilio.com/
3. Click on `Programmable SMS` on the side panel
4. Click on `Messaging Services`, and click the plus
5. Create a friendly name
6. Under `Properties`
  - `SERVICE SID` is `TWILIO_MESSAGE_SERVICE_SID`
7. Under `Inbound Settings`
  - Make sure `PROCESS INBOUND MESSAGES` is selected
  - `REQUEST URL` is `https://<YOUR_NGROK_APP_URL>/twilio` (or for heroku instructions, `https://<YOUR_HEROKU_APP_URL>/twilio`)
8. Under Outbound Settings
  - `STATUS CALLBACK URL` in your Twilio console is `https://<YOUR_NGROK_APP_URL>/twilio-message-report` (or for heroku instructions, `https://<YOUR_HEROKU_APP_URL>/twilio-message-report`)
  - TWILIO_STATUS_CALLBACK_URL in your .env file is `https://<YOUR_NGROK_APP_URL>/twilio-message-report` (or for heroku instructions, `https://<YOUR_HEROKU_APP_URL>/twilio-message-report`)
9. Visit the [dashboard](https://www.twilio.com/console)
10. Under `Account Summary`
  - `TWILIO_API_KEY` in your .env file (or heroku config variable) is `ACCOUNT SID` in your Twilio console
  - `TWILIO_APPLICATION_SID` is `TWILIO_MESSAGE_SERVICE_SID` (these are the same values)
  - `TWILIO_AUTH_TOKEN` in your .env file (or heroku config variable) is `AUTH TOKEN` in your Twilio console
11. If you want to send live text messages as part of your testing, you must buy a phone number and attach it to your project.
