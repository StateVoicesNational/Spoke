# Instructions for one click deployment to heroku
- Create a heroku account (if you don't have an account)- you will need to connect a credit card to your account
- Fill out environment variables in form --> instructions about that below
- Do not start any of the processes/dynos besides `web` (see below for non-Twilio uses)
- The default setup is a free tier for processing and the database. See below for scaling and production requirements


## Notes about auth0 environment variable setup
- Create an auth0 account
- Click on `Clients`
- Click on `+Create Client`
- Create a name and click on click on `Single Page App` - click create
- If it asks for `What technology are you using?` - click ReactJS
- Click on `Settings` in the tabs
- You should see 3 variables at the top you need for your Heroku app.
  - Domain name = AUTH0_DOMAIN
  - Client ID = AUTH0_CLIENT_ID
  - Client Secret = AUTH0_CLIENT_SECRET
- These variables should be placed in your heroku environment variables form
- Scroll to `Allowed Callback URLs` section and update it with (your heroku_app_url):
  - `https://<YOUR_HEROKU_APP_URL>/login-callback, http://<YOUR_HEROKU_APP_URL>/login-callback`

- Scroll to `Allowed Logout URLs` section and update it with (your heroku_app_url):
  - `https://<YOUR_HEROKU_APP_URL>/login-callback, http://<YOUR_HEROKU_APP_URL>/login-callback`

  - `https://<YOUR_HEROKU_APP_URL>/login-callback` = AUTH0_LOGIN_CALLBACK
  - `https://<YOUR_HEROKU_APP_URL>/logout-callback` = AUTH0_LOGOUT_CALLBACK
- Scroll to `Allowed Origin (CORS)` add:
  - ` http://*.herokuapp.com`, ` https://*.herokuapp.com`
- Scroll to bottom and click on `Advanced Settings`
- Click on `OAuth` - make sure `OIDC Conformant` is turned off.


## Notes about Twilio environment variable setup
If you need to use Twilio in development but with live keys, click [here](https://github.com/MoveOnOrg/Spoke/blob/main/docs/HOWTO_INTEGRATE_TWILIO.md) for instructions.

Visit [here](https://www.twilio.com/docs/api/messaging/services-and-copilot) to configure messaging service features


## Setting up for production scale (Database, etc)

The default deployment from the Heroku button is free, but has a processing and database limit of 10,000 messages total.
This may be sufficient for a single small campaign, but if you intend multiple/regular campaigns, we recommend upgrading
the database and possibly the `web` 'dyno' instance (to [Hobby or Standard](https://devcenter.heroku.com/articles/dynos)).  At the time of this writing a ['hobby basic' level for the database is ~$9.00/month](https://devcenter.heroku.com/articles/heroku-postgres-plans#plan-tiers).

For production scale, the best time to upgrade the database is before you start using the app, because the easiest path erases all
previous data.  If you have existing data, please refer to Heroku docs on [how to upgrade a database](https://devcenter.heroku.com/articles/upgrading-heroku-postgres-databases) (it's complicated).

If you haven't used the app, after you've created the instance (filled out the variables, and 'deployed' it)
follow these steps:

1. Go to the 'Resources' tab for your app and scroll to the bottom
2. Under 'Add-ons' to the right end of the "Heroku Postgres::Database" line, click the little up-down carrot
3. Choose 'Remove' and follow the procedure for removal
4. Then, in the 'Add-ons' search box (where it says 'Quickly add add-ons from Elements'), type "postgres"
5. Choose the "Heroku Postgres" option and then choose the tier you desire (see Heroku Postgres tier documentation for details)
6. At the very top of the page for your app, in the upper right click the 'More' button and choose 'Restart all dynos'


## Non-Twilio Processes/Dynos

When using Twilio we recommend keeping the environment variable `JOBS_SAME_PROCESS` enabled and only running the `web` process/dyno.
There is another mode mostly for non-Twilio backends, where you may need to run the additional processes to process messages and sending.  Most times, even at high scale, you will want to keep `JOBS_SAME_PROCESS` on and increase or upgrade the dynos for the `web` process.

## Setting Up Mailgun
In order to configure Mailgun to actually send emails, you'll need to configure a domain for it. To do so, navigate
to Add-Ons in your Heroku app, click on Mailgun, and then click on Domains. You'll need to go to your DNS provider, add
those TXT and MX records, wait a few minutes, and click the button to check for changes in DNS. After it says your domain
is set up, you should be good to go.
