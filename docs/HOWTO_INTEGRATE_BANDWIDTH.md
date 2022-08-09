# Bandwidth Integration

Bandwidth.com is a telephone service API company. To use Bandwidth, set your environment variable DEFAULT_SERVICE to bandwidth: `DEFAULT_SERVICE=bandwidth`

## Service Manager Instructions
- These changes need to occur in your .env file or anywhere your Configuration Variables are set.
- The `sticky-sender` and `num-picker` service managers are required for the Bandwidth extension to work. `sticky-sender` must come before `numpicker-basic` in the `SERVICE_MANAGERS` environment variable.

Example:
```json
SERVICE_MANAGERS=sticky-sender,numpicker-basic
```

- You can find more documentation about additional Service Managers, [here.](HOWTO-use-service-managers.md)

- For setting up a `development environment` with Bandwidth, first read [this section](HOWTO_DEVELOPMENT_LOCAL_SETUP.md#ngrok).


## Bandwidth Instructions

1. Create a Bandwidth account and login.
2. Create a sub-account.
3. Note the `sub-account id` for use later.
4. Add a location to your sub-account.
5. Give the location a name.
6. Note the `location id` for use later.
7. Click the "MESSAGING" tab of the location.
6. Fill out the following fields:
    1. Enable `SMS Enabled`
    2. Enable `Toll Free`
    3. Enable `Short Codes` (This may not be enabled, depending on your Bandwidth account)
    4. Enable `V2 Messaging`
    5. Enable `MMS Enabled`
7. Leave all other values as their default value.
8. Click the "SAVE CHANGES" button.
9. Create an application. Fill out the following fields:
- Set your `BASE_URL` without the trailing `/`

EXAMPLE:
https://your-spoke.herokuapp.com



- Callback URL: `<BASE_URL>/bandwidth/<ORGANIZATION_ID>`

EXAMPLE:
https://your-spoke.herokuapp.com/bandwidth/1

- Enable `Use a username/password for callbacks`
- Callback user ID: `bandwidth.com`

10. Open a new tab and go to the following website: https://www.tutorialspoint.com/execute_nodejs_online.php
11. Paste the following code into the code editor:
    ```
    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", "<SESSION_SECRET_ENV_VAR>");
    const test = hmac.update("<BASE_URL_ENV_VAR>");
    hmac.update(String(<ORGANIZATION_ID>));
    console.log(hmac.digest("base64"));
    ```
12. Click the "Execute" button in the top left corner. A value will be printed to the console on the right of the screen. Copy the value.
13. Go back to the Bandwidth application tab.
14. Paste the value into the following "Callback password" field. This value being set as the callback password provides HMAC authentication for Bandwidth.
15. Leave all other fields as their default value.
16. Click the "CREATE APPLICATION" button.
17. Note the `Application Id` that is created for use later
17. Associate the created location to the application.


## Spoke Instructions

1. Navigate to the admin settings page of an organization.
2. Under the "Bandwidth Config" section, enter your Bandwidth account ID, API username (most likely your email), and API password (most likely your account password). The API user must have the `Configuration` role in Bandwidth.
    - You can check this by looking under the `Users` menu and checking on the bRoles assigned to the user.
3. In the Advanced tab, fill out the `sub-account`, `location id`, and `application id` you noted above.
4. Click the "SAVE CREDENTIALS" button.
