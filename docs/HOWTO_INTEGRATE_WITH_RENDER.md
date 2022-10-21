# How to integrate with Render

## Purpose
In order to support our users in accessing low-cost and free tech, figuring out how to integrate with Render is a Heroku-Alternative Initiative.

## Instructions for initial integration
- Go to this [repository](https://github.com/MoveOnOrg/Spoke) and fork it.
- Sign into your [Render Account](https://render.com/)
    - You have the option to sign in through your github account, gitlab account, or gmail account.  This integration instructions used Gmail Account.

## Make Database
    - click `render` on the top left hand corner.
    - click `New` the purple button.
    - click `New PostgresSQL`
    - `Name` - Render Name (keep this information for later)
    - `Database` - Randomly generated if left blank (keep this information for later)
    - `User` - Randomly generated if left blank (keep this information for later)
    - `Region` - Leave your default region. (keep this information for later)
    - `PostgreSQL Version` - set to 11
    - `plans`
    - Free is 256 MB, CPU shared (again, have to check what security means for that) and STORAGE is 1GB.  That's great!
    - Starter: RAM 256MB, CPU: shared, Storage 1GB = $7/month
    - Standard: RAM 1 GB, CPU 1, Storage 16 GB, $20/month.
    - Free plan databases will expire in 90 days and will be deleted if not upgraded. Learn more about free plan limits.
    - [Go here for more information](https://render.com/docs/free)
    - You will get a notification of the expiration date of your account
    - You will need to purchase at least the Starter Package.

## Make a Webservice
- Once logged in, click on `Make Webservice`
  - Connect to your forked Spoke repository (directions below)
    - click `Connect account`, under GitHub
    - A permissions page will open and request for authority to act on your behalf (similar to permissions given through Heroku to pull in a branch from your updated code.)
    - Click `Authorize Render`
    - If you have multiple organizations, pick the organization where your forked repository exists.
    - Decide if you want Render to be installed for all your repositories or only select repositories.
    - I've chosen only select repositories.
    - Click install
    - Authorize your account
    - It sometimes returns back to the original screen with no instructions on what to do next.  Don't be alarmed! That might mean it worked! Please click `Create New Webservice` again, and you should see your repository linked with a purple button reading `connect`
- Now you should see a message that is suggesting `Docker`
  - If not, please enter the following:
    - `Name` - your name, it helps if it's your organization or campaign name with spoke next to it.
    - `Environment` - Docker
    - `Region` - default value
    - `Branch` - pick the branch from your repository, typically in production, the branchname is main.

## Setting Up Required Environment Variables
- Under `Advanced`
  - `Environment Variable`
    EXAMPLE:  `THE_ENVIRONMENT_VARIABLE` = IT'S VALUE
    Sometimes, there are additional steps for finding the correct value for your environment variables.  Below is the best grouping of all required environment variables to make your integration successful!

### Auth0 Environment Variables & Instructions
**Follow [these instructions](https://moveonorg.github.io/Spoke/#/HOWTO_HEROKU_DEPLOY?id=instructions-for-auth0-configuration-variable-setup) to get the correct values for the following environment variables:**
  - `AUTH0_CLIENT_ID` = [your auth0 client id]
  - `AUTH0_CLIENT_SECRET` = [your auth0 client secret]
  - `AUTH0_DOMAIN` = [your auth0 domain: XXXXX.us.auth0.com]
  - If you're having a hard time with your Auth0 Integration, double check your permissions within your Auth0 Account.
    - Allowed Callback URLs - https://yourspoke.onrender.com/login-callback, https://yourspoke.onrender.com/login
    - Allowed Web Origins - https://yourspoke.onrender.com
    - Allowed Logout URLs - https://yourspoke.onrender.com/logout-callback
    - Allowed Origins (CORS) - https://yourspoke.onrender.com
    - In advanced settings turn off the OIDC Conformant.
### Database values
**Once you have created your database (instructions below) you will be able to access this information.  Once a database has been created in Render, under Connections, find the following values for:**
  - `DB_HOST` = [in Render as HostName]
  - `DB_NAME` = [in Render as Database]
  - `DB_PASSWORD` = [in Render as Password]
  - `DB_USER` = [in Render as Username]
  - `DB_PORT` = [in Render as Port] typically 5432

### Required Environment Variables and exact values  
**add the following required environment variables and their respective values:**
  - `DB_TYPE` = pg
  - `ACTION_HANDLERS` = ""
  - `DB_USE_SSL` = ""
  - `DEFAULT_SERVICE` = twilio [can be set to bandwidth]
  - `DEFAULT_TZ` = US/Eastern
  - `DST_REFERENCE_TIMEZONE` = US/Eastern
  - `EMAIL_FROM` = ""
  - `EMAIL_HOST` = ""
  - `EMAIL_HOST_PASSWORD` = ""
  - `EMAIL_HOST_PORT` = ""
  - `EMAIL_HOST_USER` = ""
  - `JOBS_SAME_PROCESS` = 1
  - `KNEX_MIGRATION_DIRECTORY` = /spoke/build/server/migrations/
  - `NGP_VAN_API_KEY` = ""
  - `NGP_VAN_APP_NAME` = ""
  - `NGP_VAN_DATABASE_MODE` = 0
  - `NODE_ENV` = production
  - `OWNER_CONFIGURABLE` = ALL
  - `PHONE_INVENTORY` = 1
  - `PHONE_NUMBER_COUNTRY` = US
  - `PASSPORT_STRATEGY` = auth0
  - `SESSION_SECRET` = secret
  - `SUPPRESS_MIGRATIONS` = ""
  - `SUPPRESS_SELF_INVITE` = 0

### Twilio Integration
__for more information, follow this link: [Twilio Integration](https://moveonorg.github.io/Spoke/#/HOWTO_INTEGRATE_TWILIO?id=twilio-integration)__
  - `TWILIO_ACCOUNT_SID` = ""
  - `TWILIO_AUTH_TOKEN` = ""
  - `TWILIO_MULTI_ORG` = 1
  - `TWILIO_VALIDATION` = ""

### Optional Environment Variables

- If you want to set up NGPVAN, here is a quick Cheat-Sheet for NGP VAN Integration
__for more info, follow this link, [NGPVAN User Guide](https://moveonorg.github.io/Spoke/#/REFERENCE-NGPVAN_user_guide?id=ngpvan-integration-user-guide)__
    - `CONTACT_LOADERS` = ngpvan
    - `SERVICE_MANAGERS` = ngpvan
    - `ACTION_HANDLERS` = ngpvan
    - `MESSAGE_HANDLERS` = ngpvan
    - `NGP_VAN_API_KEY`= [Your NGP VAN API Key]
    - `NGP_VAN_APP_NAME` = [Your NGP VAN App Name]
    - `NGP_VAN_DATABASE_MODE` = 0
    - Go to top of the WebService
    - Click on `Manual Deploy` and select `Clear build cache & deploy`

- If you want to set up different Texter Sidebox Experiences, here is a Cheat-Sheet for Texter Sidebox Add-Ons
__for more info, follow this link: [How To Use Texter Sideboxes](https://moveonorg.github.io/Spoke/#/HOWTO-use-texter-sideboxes)__
    - `TEXTER_SIDEBOXES` = celebration-gif,default-dynamicassignment,default-releasecontacts,contact-reference,tag-contact,freshworks-widget,default-editinitial,take-conversations,hide-media,texter-feedback
    - Go to top of the WebService
    - Click on `Manual Deploy` and select `Clear build cache & deploy`

### Final Webservice Settings
- `Secret File`
  - skip!
- `Health Check Path`
  - skip!
- `Docker Build Context Directory`
  - skip!
- `Dockerfile Path`
  - This is what we need to add: `./Dockerfile`
- `Docker Command`
  - skip!
- `Auto-Deploy`
  - set to yes.
- Click on `Create Web Service`

### Required Environment Variable BASE_URL
**Locating your BASE_URL after you create your Webservice**
- `BASE_URL`
- The value of this environment variable will look similar to this url: https://YourSpokeExampleApp.onrender.com
- You will find this link on the top left hand corner of the screen AFTER you have successfully created this Webservice.
- On the top settings of your WebService, click on `Manual Deploy` and select `Clear build cache & deploy`
- Wait for the new changes to impact the build, and you're ready to go!

## Instructions for how to decommission Render Application

## Instructions for upgrading an already existing Render Application
