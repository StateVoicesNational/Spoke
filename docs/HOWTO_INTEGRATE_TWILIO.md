# Twilio Integration

You will need to create a Twilio account in order to test outgoing and incoming replies and/or to live text with Heroku or AWS. If you need to use Twilio with live keys, do the following to send messages and receive incoming replies:


## Instructions

### Note
If you are using these instructions for an Heroku instance or AWS Lambda instance, replace references to <YOUR_NGROK_APP_URL> with your actual app url (i.e. examplespokeapp.herokuapp.com )

1. If you are using these instructions for development (not Heroku), you can use [ngrok](https://ngrok.com/docs) to allow Twilio to communicate with Spoke.
  - Create an ngrok account: https://ngrok.com/
  - For a paid ngrok account, a reasonable command line for `ngrok` is `ngrok http -subdomain=<UNIQUE_NAME> 3000` (Replace <UNIQUE_NAME> with something likely to be globally unique. Use the same <UNIQUE_NAME> each time you start ngrok. If you use a different <UNIQUE_NAME> it will be necessary to change the configuration in Twilio and in your .env file.)
  - For a free ngrok account, ngrok can be started with `ngrok http 3000` (Because a free account receives a different, randomly-assigned URL every time ngrok is started, it will be necessary to change the configuration in Twilio and in your .env file each time.)
  - When you start `ngrok`, it will display the external-facing app URL. Use that below to replace <YOUR_NGROK_APP_URL>
2. Create a Twilio acccount: https://www.twilio.com/
3. Click on `Programmable SMS` on the side panel
4. Click on `Messaging Services`, and click the plus
5. Create a Friendly Name and select the `Mixed` Use Case, then click `Create`
6. Under `Properties`
  - `TWILIO_MESSAGE_SERVICE_SID` in your .env file is the `SERVICE SID` displayed in Twilio
7. Under `Inbound Settings`
  - Make sure `SEND AN INCOMING_MESSAGE WEBHOOK` is selected
  - `REQUEST URL` is `https://<YOUR_NGROK_APP_URL>/twilio` (or for Heroku instructions, `https://<YOUR_HEROKU_APP_URL>/twilio`) using `HTTP POST`
  - Set `FALLBACK URL` to the same as `REQUEST URL`
8. Under `Outbound Settings`
  - `STATUS CALLBACK URL` in your Twilio console is `https://<YOUR_NGROK_APP_URL>/twilio-message-report` (or for Heroku instructions, `https://<YOUR_HEROKU_APP_URL>/twilio-message-report`)
  - In your .env file, set `TWILIO_STATUS_CALLBACK_URL` to this same URL
9. Click `Save`, and then visit the [dashboard](https://www.twilio.com/console)
10. Under `Account Summary`
  - `TWILIO_API_KEY` in your .env file (or Heroku config variable) is `ACCOUNT SID` in your Twilio console
  - `TWILIO_APPLICATION_SID` in your .env file (or Heroku config variable) is `TWILIO_MESSAGE_SERVICE_SID` (these are the same values)
  - `TWILIO_AUTH_TOKEN` in your .env file (or Heroku config variable) is `AUTH TOKEN` in your Twilio console
11. In your .env file, set `DEFAULT_SERVICE` to `twilio`
12. If you want to send live text messages as part of your testing, you must buy a phone number and attach it to your project.
  - Click on `Numbers` and press on `+`. Search for a area code and click on buy (trial Twilio accounts give you $15~ to work with). In order to send messages, you will have to connect a credit card with a minimum charge of $20. 
