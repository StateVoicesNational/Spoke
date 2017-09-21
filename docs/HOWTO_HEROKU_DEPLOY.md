# Instructions for after you click - deploy to heroku
- Fill out environment variables
- Database variables come from heroku database created for project located in database credentials
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

- Scroll to bottom and click on `Advanced Settings`
- Click on `OAuth` - make sure `OIDC Conformant` is turned off.

## Notes about twilio environment variable setup

## Notes about using Postgres
