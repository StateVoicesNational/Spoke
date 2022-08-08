# Bandwidth Integration

Bandwidth.com is a telephone service API company. To use Bandwidth, set `DEFAULT_SERVICE=bandwidth`. The `sticky-sender` and `numpicker-basic` service managers are required for the Bandwidth extension to work. `sticky-sender` must come before `numpicker-basic` in the `SERVICE_MANAGERS` environment variable. NOTE: Because service managers are complicated, there is not an entry for SERVICE_MANAGERS in the Spoke Documentation Hub. Just add it as an enviromental variable.

For setting up a development environment with Bandwidth, first read [this section](HOWTO_DEVELOPMENT_LOCAL_SETUP.md#ngrok).


## Bandwidth Instructions

1. Create a Bandwidth account and login.
2. Create a sub-account.
3. Note the sub-account id for use later.
4. Add a location to your sub-account.
5. Give the location a name.
6. Note the location id for use later.
7. Click the "MESSAGING" tab of the location.
8. Fill out the following fields:
    1. Enable `SMS Enabled`
    2. Enable `Toll Free`
    3. Enable `Short Codes` (This may not be enablable, depending on your Bandwitdth account)
    4. Enable `V2 Messaging`
    5. Enable `MMS Enabled`
9. Leave all other values as their default value.
10. Click the "SAVE CHANGES" button.
11. Create an application. Fill out the following fields:
    1. Callback URL: `<BASE_URL_ENV_VAR>/bandwidth/<ORGANIZATION_ID>` for example https://your-spoke.herokuapp.com/bandwidth/1
    2. NOTE: If your Spoke instance doesn't have a BASE_URL environmental variable **you must set it**. The BASE_URL environmental variable should not include the trailing slash (ie. just https://your-spoke.herokuapp.com)
    3. Enable `Use a username/password for callbacks`
    4. Callback user ID: `bandwidth.com`
12. Open a new tab and go to the following website: https://www.tutorialspoint.com/execute_nodejs_online.php
13. Paste the following code into the code editor. The values can be found in your environmental variables :
    ```
    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", "<SESSION_SECRET_ENV_VAR>");
    const test = hmac.update("<BASE_URL_ENV_VAR>");
    hmac.update(String(<ORGANIZATION_ID>));
    console.log(hmac.digest("base64"));
    ```
12. Click the "Excecute" button in the top left corner. A value will be printed to the console on the right of the screen. Copy the value.
13. Go back to the Bandwidth application tab.
14. Paste the value into the following "Callback password" field. This value being set as the callback password provides HMAC authentication for Bandwidth.
15. Leave all other fields as their default value.
16. Click the "CREATE APPLICATION" button.
17. Note the Application Id that is created for use later.
18. Associate the created location to the application.


## Spoke Instructions

1. Navigate to the admin settings page of an organization.
2. Under the "Bandwidth Config" section, enter your Bandwidth account ID, API username (probably your email address), and API password (probably just your account password). If you use an API, the user must have the `Configuration` role in Bandwidth. You can check this by looking under the Users menu and checking on the Roles assigned to the user.
3. In the Advanced tab, fill out the sub-account, location, and application IDs you noted down above.
4. Click the "SAVE CREDENTIALS" button.
