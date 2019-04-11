# Instructions for one click deployment to Heroku
- Create a Heroku account (if you don't have an account). For more questions on Heroku and what it does, please visit [here](https://www.heroku.com/what)
- The form you fill out in Heroku has a lot of values. These are configuration values (also known as environment variables). Each value is essentially a setting. Some are necessary for deployment and others customize the experience in your instance of Spoke. For more questions about configuration values in this application visit [our documentation on environment variables and what they do](REFERENCE-environment_variables.md). For more questions in general about configuration variables in Heroku, visit [Heroku's config variable explanation page](https://devcenter.heroku.com/articles/config-vars)
- Do not start any of the processes/dynos besides `web` (see below for non-Twilio uses)
- The default setup is a free tier for processing and the database. See below for scaling and production requirements

## Important Note for First Time Deployers:
- There is a variable named `SUPPRESS_SELF_INVITE` in your configuration variables in Heroku. When this is set to nothing, anyone can visit your app and create an organization. When it is set to `true`, this changes login/signup behavior - when a person signs up and visits your app, they will not create an organization. On first deployment, it should be set to nothing to ensure that you have the ability to create an organization and view the full functionality of the application.

## Instructions for Auth0 configuration variable setup
- Create an Auth0 account - click [here to visit Auth0's website to signup](https://auth0.com/signup)
- After logging in to account, click on `Clients`
- Click on `+Create Client`
- Create a name and click on click on `Single Page App` - click create
- If it asks for `What technology are you using?` - click React
- Click on `Settings` in the tabs
- You should see 3 variables at the top you need for your Heroku app.
  - `Domain name` will be the value to put into the value for `AUTH0_DOMAIN` in Heroku
  - `Client ID` will be the value to put into the value for `AUTH0_CLIENT_ID` in Heroku
  - `Client Secret` will be the value to put into the value for `AUTH0_CLIENT_SECRET` in Heroku

- Scroll to `Allowed Callback URLs` section and update it with your HEROKU_APP_URL:
  - `https://<YOUR_HEROKU_APP_URL>/login-callback, http://<YOUR_HEROKU_APP_URL>/login-callback`

- Scroll to `Allowed Logout URLs` section and update it with (your HEROKU_APP_URL):
  - `https://<YOUR_HEROKU_APP_URL>/logout-callback, http://<YOUR_HEROKU_APP_URL>/logout-callback`

- Scroll to `Allowed Origin (CORS)` add:
  - `http://*.<YOUR_HEROKU_APP_URL>.com`, ` https://*.<YOUR_HEROKU_APP_URL>.com`
- Scroll to `Allowed Web Origins` add:
  - `http://<YOUR_HEROKU_APP_URL>.com`, ` https://<YOUR_HEROKU_APP_URL>.com`
- Scroll to bottom and click on `Advanced Settings`
  - Click on `OAuth` - make sure `OIDC Conformant` is turned off
- Then create a rule in Auth0:
  - Click [here](https://manage.auth0.com/#/rules/create) to navigate to rule creation tab when logged into Auth0
  - Note: name of rule can be anything
  - Paste the following code in the box where it says `function`:
    ```javascript
    function (user, context, callback) {
      context.idToken["https://spoke/user_metadata"] = user.user_metadata;
      callback(null, user, context);
    }
  - Now, it should only say the pasted code in the box. Click save.


## Notes about Twilio configuration variable setup
If you need to use Twilio in development but with live keys, click [here](HOWTO_INTEGRATE_TWILIO.md) for instructions.
When using instructions, please remember that references to NGROK urls should change to your Heroku app url.

Visit [here](https://www.twilio.com/docs/api/messaging/services-and-copilot) to configure messaging service features


## Setting up for production scale (Database, etc)

The default deployment from the Heroku button is free, but has a processing and database limit of 10,000 messages total.
This may be sufficient for a single small campaign, but if you intend multiple/regular campaigns, we recommend upgrading
the database and possibly the `web` 'dyno' instance (to [Hobby or Standard](https://devcenter.heroku.com/articles/dynos)).  At the time of this writing a ['hobby basic' level for the database is ~$9.00/month](https://devcenter.heroku.com/articles/heroku-postgres-plans#plan-tiers).

For production scale, the best time to upgrade the database is before you start using the app, because the easiest path erases all
previous data.  If you have existing data, please refer to Heroku docs on [how to upgrade a database](https://devcenter.heroku.com/articles/upgrading-heroku-postgres-databases) (it's complicated).

If you have not used the app, after you've created the instance (filled out the variables, and 'deployed' it)
follow these steps:

1. Go to the 'Resources' tab for your app and scroll to the bottom
2. Under 'Add-ons' to the right end of the "Heroku Postgres::Database" line, click the little up-down carrot
3. Choose 'Remove' and follow the procedure for removal
4. Then, in the 'Add-ons' search box (where it says 'Quickly add add-ons from Elements'), type "postgres"
5. Choose the "Heroku Postgres" option and then choose the tier you desire (see Heroku Postgres tier documentation for details)
6. At the very top of the page for your app, in the upper right click the 'More' button and choose 'Restart all dynos'


## Non-Twilio Processes/Dynos

When using Twilio we recommend keeping the configuration variable `JOBS_SAME_PROCESS` enabled and only running the `web` process/dyno.
There is another mode mostly for non-Twilio backends, where you may need to run the additional processes to process messages and sending.  Most times, even at high scale, you will want to keep `JOBS_SAME_PROCESS` on and increase or upgrade the dynos for the `web` process.

## Email configuration
See [this guide](EMAIL_CONFIGURATION.md) for instructions.

## Data exporting
In order to export data from campaigns (such as contacts' responses to questions), you need to configure S3 or Bucketeer. See [this guide](DATA_EXPORTING.md) for instructions.

## Upgrading an existing Heroku app

Spoke now runs on the Heroku [container stack](https://devcenter.heroku.com/categories/deploying-with-docker). Before updating an existing instance of Spoke, the target application needs to be [configured to use this stack](https://devcenter.heroku.com/articles/stack#migrating-to-a-new-stack) if it is not already.

To update to the `container` stack, run:

```cli
heroku stack:set container --app myspokeapp
```

Then push to heroku from the branch that you wish to deploy:

```cli
git remote add heroku https://git.heroku.com/myspokeapp.git
git push heroku master
```
