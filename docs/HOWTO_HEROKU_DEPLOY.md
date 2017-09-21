# Instructions for one click deployment to heroku
- Create a heroku account (if you don't have an account)- you will need to connect a CC to your account
- Fill out environment variables in form --> instructions about that below


## Heroku Database Installation-client
- Database variables come from heroku database created for project located in database credentials. This app will create a heroku postgres database after you click deploy in the github repo. To get credentials:
  - Visit https://dashboard.heroku.com/apps/<YOUR_APP_NAME>
  - Find `Installed add-ons` section and click on `Heroku Postgres`
  - You will be redirected to a page that includes `Datastores > <name of your postgresql instance` at the top
  - Click on `Settings`
  - Find `Database Credentials` section and click on `View Credentials ...`
    - Host = DB_HOST
    - Database = DB_NAME
    - User = DB_USER
    - Port = DB_PORT
    - Password = DB_PASSWORD
  - These variables should be placed in your Heroku environment variables form

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


-
