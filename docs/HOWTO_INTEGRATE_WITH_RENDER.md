# How to integrate with Render

## Purpose
In order to support our users in accessing low-cost and free tech, figuring out how to integrate with Render is a Heroku-Alternative Initiative.

Find information and stats on Render...

Explain what Render is...

## Instructions for initial integration
- Go to this repository and fork it. [get spoke repository link]
- Sign into your Render Account [link render account here](https://dashboard.render.com/)
  - you have the option to sign in through your github account, gitlab account, or gmail account.  This integration instructions used Gmail Account.
- Once logged in, I click on the `Make Webservice`
  - Connect to your forked Spoke repository
    - click `Connect account`, under GitHub
    - A permissions page will open and request for authority to act on your behalf (similar to permissions given through Heroku to pull in a branch from your updated code.)
    - Click `Authorize Render`
    - If you have multiple organizations, pick the organization where the forked repository exists.
    - Decide if you want Render to be installed for all your repositories or only select repositories.
    - I've chosen only select repositories.
    - Click install
    - Authorize your account
    - It sometimes returns back to the original screen with no instructions on what to do next.  Don't be alarmed! That might mean it worked! Please click `Create New Webservice` again, and you should see your repository linked with a purple button reading `connect`
- Now you should see a message that is suggesting `Docker`
    - If not, please enter the following:
    - `Name` - your name, it helps if it's your organization or campaign name with spoke next to it.
    - `Environment` - Docker
    - `Region` - Oddly there are only four choices, all bizzare, I went with what they picked for me, Oregon. Ohio has east if that matters to you.  The other two options are Singapore and Frankfurt EU
    - `Branch` : pick the branch from your repository, typically in production is main.
- For `plans`
    - We are testing to see if the Free Plan is enough to sustain the application.
    - This has a RAM of 512 MB and CPU of status shared << I'm not sure what that means for security but for now it seems okay.  Need to check it.
    - The Starter Plan is just $7/month which gives RAM 512 MB and CPU 0.5
    - The Starter Plus is RAM 1GB CPU 1 at $15/month
- Under `Advanced`
    - `Environment Variable`
        - There needs to be an environment variable that we add, but I need circle back and get it. [GET THE ENVIRONMENT VARIABLE NAME AND ADD THOSE INSTRUCTIONS HERE].  For now, I am skipping.
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
    - it is building...
    - It found Docker and is done with the WORKDIR /spoke
    - I don't know what's going to happen with this and not having the backend set up yet.
    - Honestly, now I'm expecting it to fail.
    - Actually, it's merging the pull requests right now.
    - First error message.  Code: ENOENT for path .env
    - That makes sense.
    - It's still surviving
    - It's building!
    - It finished the builder.  Now it's exporting layers.
    - exporting cache, cool cool!
    - It's pushing an image to registry
    and Now it's done.
    - Jk, now it's looking for the server...it won't find one!  Is this where it crashes?
    - yup!  Got the npm error!
    - As expected this build failed.  Let's go set up the Backend.


Make Database
- click `render` on the top left hand corner.
- click `New` the purple button.
- click `New PostgresSQL`
    - `Name` - anything you want.
    - `Database` - leave blank (or name if you require multiple databases) (check if it can hold multiple databases!) Allow it to randomly generate the database and then see if you can add a second!
    - `User` - leaving blank
    - Region - mine defaulted to Oregon (US West)
    - `PostgreSQL Version` this was autofilled as 14. Spoke is currently on version 8.0.3
    - Well shoot, the lowest version on PostgreSQL Version is 11.  Let's see how this goes!  Hopefully fine!
- `plans`
    - Free is 256 MB, CPU shared (again, have to check what security means for that) and STORAGE is 1GB.  That's great!
    - Starter: RAM 256MB, CPU: shared, Storage 1GB = $7/month
    - Standard: RAM 1 GB, CPU 1, Storage 16 GB, $20/month.
    - These are very good prices.
    - Free plan databases will expire in 90 days and will be deleted if not upgraded. Learn more about free plan limits.
- Folks, it's important to know the Free Plan Limits, and the starters are great if you know it ends in 90 days which is a perfect season for GOTV accounts  [Go here for more information](https://render.com/docs/free)
- Free Plans are currently not meant for general production, but it does allow for 750 hours of running time per month and the ability to monitor your Billing.
- I still think it is a very affordable rate.

Linking backend and frontend
- The database is creating.
- I named this version spoke-backend
- It tells me my expiration date of my account
- And it looks like it is available and it has used 2.05% of it's 1GB storage.  Good information in the UI.
- There is a Connections sections that I think will be important when trying to link up the frontend and the backend.
- For now let's just take note of the variables available
  - Hostname
  - Port
  - Database (this is the name)
  - Username
  - Password
  - Internal Database URL
  - External Database URL
  - PSQL Command
- Currently, I believe we'll only need the `Internal Database URL` because this is being built internally within Render.
- Access Control shows 1 connection is allowed from outside my private network.  Don't know yet if that's significant to our integration documentation.
- When I scroll up there is a white connect button on the top
- Whoop Whoop! I'm right! The Internal Connection Database URL is going to be important!
- There is a link for the documents here, let's check that out:

Well wow!  It's right there ain't it.  I have to add the dbhostname, the port, the database, and the username into the environment variables and then maybe there is a connection between the two.

- Today I have begun to enter some environment variables that we might see in a typical Spoke Build.  [Work on cheatlist for often asked questions]
- `NODE_ENV` = production
- `SUPPRESS_SELF_INVITE` = set to 0 [check is that's the right standard] [Explain what this does]
- `JOBS_SAME_PROCESS` = 1
- **Locate the following information under your Backend Info, under Connections**
    - `DB_HOST` = ADD YOUR HOSTNAME
    - `DB_PORT` = ADD YOUR PORT
    - `DB_NAME` = ADD YOUR DATABASE
    - `DB_USER` = ADD YOUR USERNAME
    - `DB_PASSWORD` = ADD YOUR PASSWORD
- `DB_TYPE` = pg
- `PASSPORT_STRATEGY` = auth0
    - Follow these intructions for adding the following variables
    - `AUTH0_DOMAIN`
    - `AUTH0_CLIENT_ID`
    - `AUTH0_CLIENT_SECRET`
    - [IF THIS CONFIGURATION FAILS:] I need to go into the Auth0 Documentation and make sure that I have added this Web Service's URL links into the Auth0 authorized urls!!!
- `BASE_URL` [Find the correct documentation for setting the BASE_URL] gonna skip this one for now!

- Cheat-Sheet for NGP VAN Integration
    - `CONTACT_LOADERS` = ngpvan
    - `SERVICE_MANAGERS` = ngpvan
    - `ACTION_HANDLERS` = ngpvan
    - `MESSAGE_HANDLERS` = ngpvan
    - `NGP_VAN_API_KEY`= [Your NGP VAN API Key]
    - `NGP_VAN_APP_NAME` = [Your NGP VAN App Name]
    - `NGP_VAN_DATABASE_MODE` = 0 or 1 (find the correct documentation for which mode means what.)

- Cheat-Sheet for Texter Sidebox Add-Ons
    - `TEXTER_SIDEBOXES` = celebration-gif,default-dynamicassignment,default-releasecontacts,contact-reference,tag-contact,freshworks-widget,default-editinitial,take-conversations,hide-media,texter-feedback
- Skipping Adding Secret File
- CLICK SAVE!!!

- Now I went to the top of the WebService
- Click on `Manual Deploy` and select `Clear build cache & deploy`
    - So far so good, the frontend is building
    - It looks like this build will fail
    - The error on the backend logs is disconnection.
    - We're at the nodee build/server/erver, and it looks like there was a problem with NPM
    - And the backend keeps switching through postgress ports and claiming it's disconnected.  Let me check the logs real quick:
      - user=postgres, db=postgres, app=psql, client=::1, LOG:   disconnection:  session time: 0:00:00.096 user=postgres database=postgres host=::1 port=3564
      - My DB_HOST looks like a website.
      - I think we need to add OUTPUT_DIR, ASSETS_MAP_FILE, and that BASE_URL needs to get set.
- Environment Variables set since last attempt: (I do believe the best path after this integration is successful is to explore the Secret Files path as a quicker way to integrate.)
     - ACTION_HANDLERS = ""
     - AUTH0_CLIENT_ID = [your auth0 client id]
     - AUTH0_CLIENT_SECRET = [your auth0 client secret]
     - AUTH0_DOMAIN = [your auth0 domain: XXXXX.us.auth0.com]
     - BASE_URL = ""
     - CONTACT_LOADERS = ""
     - DB_HOST = [your render db host]
     - DB_NAME = [your render db name]
     - DB_PASSWORD = [your render db password]
     - DB_PORT = 5432
     - DB_TYPE = pg
     - DB_USE_SSL = ""
     - DB_USER = [your render db user name]
     - DEFAULT_SERVICE = twilio [can be set to bandwidth]
     - DEFAULT_TZ = US/Eastern
     - DST_REFERENCE_TIMEZONE = US/Eastern
     - EMAIL_FROM = ""
     - EMAIL_HOST = ""
     - EMAIL_HOST_PASSWORD = ""
     - EMAIL_HOST_PORT = ""
     - EMAIL_HOST_USER = ""
     - JOBS_SAME_PROCESS = 1
     - KNEX_MIGRATION_DIRECTORY = "/spoke/build/server/migrations/"
     - MESSAGE_HANDLERS = ""
     - NGP_VAN_API_KEY = ""
     - NGP_VAN_APP_NAME = ""
     - NGP_VAN_DATABASE_MODE = 0
     - NODE_ENV = production
     - OWNER_CONFIGURABLE = ALL
     - PHONE_INVENTORY = 1
     - PHONE_NUMBER_COUNTRY = US
     - PASSPORT_STRATEGY = auth0
     - SERVICE_MANAGERS = ""
     - SESSION_SECRET = secret
     - SUPPRESS_MIGRATIONS = ""
     - SUPPRESS_SELF_INVITE = 0
     - TEXTER_SIDEBOXES = ""
     - TWILIO_ACCOUNT_SID = ""
     - TWILIO_AUTH_TOKEN = ""
     - TWILIO_MULTI_ORG = 1
     - TWILIO_VALIDATION = ""



## Instructions for how to decomission Render Application

## Instructions for upgrading an already existing Render Application
