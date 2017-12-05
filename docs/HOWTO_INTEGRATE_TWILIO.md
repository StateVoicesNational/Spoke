# Twilio Integration

You will need to create a Twilio account in order to test outgoing and incoming replies and/or to live text with Heroku or AWS. If you need to use Twilio with live keys, do the following to send messages and receive incoming replies:


## Instructions

### Note
If you are using these instructions for an Heroku instance or AWS Lambda instance, replace references to <YOUR_NGROK_APP_URL> with your actual app url (i.e. examplespokeapp.herokuapp.com )

1. If you are using these instructions for development, start [ngrok](https://ngrok.com/docs).
2. Create a Twilio acccount: https://www.twilio.com/
3. Click on `Programmable SMS` on the side panel
4. Click on `Messaging Services`, and click the plus
5. Create a friendly name
6. Under `Properties`
  - `SERVICE SID` is `TWILIO_MESSAGE_SERVICE_SID`
7. Under `Inbound Settings`
  - Make sure `PROCESS INBOUND MESSAGES` is selected
  - `REQUEST URL` is `https://<YOUR_NGROK_APP_URL>/twilio`
8. Under Outbound Settings
  - `STATUS CALLBACK URL` in your Twilio console is `https://<YOUR_NGROK_APP_URL>/twilio-message-report`
  - TWILIO_STATUS_CALLBACK_URL in your .env file is `https://<YOUR_NGROK_APP_URL>/twilio-message-report`
9. Visit the [dashboard](https://www.twilio.com/console)
10. Under `Account Summary`
  - `TWILIO_API_KEY` in your .env file is `ACCOUNT SID` in your Twilio console
  - `TWILIO_APPLICATION_SID` is `TWILIO_MESSAGE_SERVICE_SID` (these are the same values)
  - `TWILIO_AUTH_TOKEN` in your .env file is `AUTH TOKEN` in your Twilio console
