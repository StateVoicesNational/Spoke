# Bandwidth Integration

Bandwidth.com is a telephone service API company. To use Bandwidth, set DEFAULT_SERVICE=bandwidth. The numpicker-basic and sticky-sender service managers are required for the Bandwidth extension to work. Make sure to include SERVICE_MANAGERS=numpicker-basic,sticky-sender


## Bandwidth Instructions

1. Create a Bandwidth account and login.
2. Create a sub-account.
3. Add a location to your sub-account.
4. Create an application. Fill out the following fields:
    1. Callback URL: `https://<YOUR_APP_URL>/bandwidth/<ORGANIZATION_ID>`
5. Leave all other fields as their default value.
6. Click the "CREATE APPLICATION" button.
7. Associate the created location to the application.


## Spoke Instructions

1. Navigate to the admin settings page of an organization.
2. Under the "Bandwidth Config" section, enter your Bandwidth account ID, API username, and API password. The API user must have the `Configuration` role in Bandwidth.
3. In the Advanced tab, fill out the sub-account, location, and application IDs.
4. Click the "SAVE CREDENTIALS" button.


## ngrok

If you are using these instructions for local development, use [ngrok](https://ngrok.com/) to allow Bandwidth to communicate with Spoke.

1. Create an ngrok account and download ngrok.
2. Start up your Spoke dev env.
3. Open a new terminal and cd to where you downloaded ngrok.
4. Run the following command: `./ngrok http 3000`. You will see an external-facing app URL. Use that to replace `<YOUR_APP_URL>` in the above instructions.
