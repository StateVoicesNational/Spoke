Variable                          | Purpose
----------------------------------|----------------------------------
APOLLO_OPTICS_KEY                 | A key for Apollo tracer.
ASSETS_DIR                        | Directory path where front-end packaged JavaScript is saved and loaded. _Required_.
ASSETS_MAP_FILE                   | File name of map file, within ASSETS_DIR, containing map of general file names to unique build-specific file names.
AUTH0_LOGIN_CALLBACK              | URL Auth0 service should redirect to after login. Should end with `/login-callback`, e.g. `https://example.org/login-callback` _Required_.
AUTH0_LOGOUT_CALLBACK             | URL Auth0 service should redirect to after logout. Should end with `/logout-callback`, e.g. `https://example.org/logout-callback`. _Required_.
AUTH0_DOMAIN                      | Domain name on Auth0 account, should end in `.auth0.com`, e.g. `example.auth0.com`. _Required_.
AUTH0_CLIENT_ID                   | Client ID from Auth0 app. _Required_.
AUTH0_CLIENT_SECRET               | Client secret from Auth0 app. _Required_.
AWS_ACCESS_AVAILABLE              | 1 or 0 to enable or disable S3 campaign exports within Amazon Lambda.
AWS_ACCESS_KEY_ID                 | AWS access key ID with access to S3 bucket, required for campaign exports outside Amazon Lambda.
AWS_SECRET_ACCESS_KEY             | AWS access key secret with access to S3 bucket, required for campaign exports outside Amazon Lambda.
AWS_S3_BUCKET_NAME                | Name of S3 bucket for saving campaign exports.
BASE_URL                          | The base URL of the website, without trailing slack, e.g. `https://example.org`, used to construct various URLs.
CAMPAIGN_ID                       | Campaign ID used by `dev-tools/export-query.js` to identify which campaign should be exported.
DB_HOST                           | Domain or IP address of database host.
DB_MAX_POOL                       | Database connection pool maximum size. _Default_: 10.
DB_MIN_POOL                       | Database connection pool minumum size. _Default_: 2.
DB_NAME                           | Database connection name. _Required_.
DB_PORT                           | Database connection port. _Required_.
DB_TYPE                           | Database connection type for [Knex](http://knexjs.org/#Installation-client). _Options_: mysql, pg, sqlite3. _Default_: sqlite3.
DB_USE_SSL                        | Boolean value to determine whether database connections should use SSL. _Default_: false.
DEFAULT_SERVICE                   | Default SMS service. _Options_: twilio, nexmo.
DEV_APP_PORT                      | Port for development Webpack server. Required for development.
EMAIL_FROM                        | Email from address. _Required_.
EMAIL_HOST                        | Email server host. _Required_.
EMAIL_HOST_PASSWORD               | Email server password. _Required_.
EMAIL_HOST_PORT                   | Email server port. _Required_.
EMAIL_HOST_USER                   | Email server user. _Required_.
GRAPHQL_URL                       | URL for GraphQL API requests. Should end with `/graphql`, e.g. `https://example.org/graphql`.
JOBS_SAME_PROCESS                 | Boolean value indicating whether jobs should be executed in the same process in which they are created (vs. processing asyncronously via worker processes). _Default_: false.
NEXMO_API_KEY                     | Nexmo API key. Required if using Nexmo.
NEXMO_API_SECRET                  | Nexmo API secret. Required if using Nexmo.
NODE_ENV                          | Node environment type. _Options_: development, production.
OUTPUT_DIR                        | Directory path for packaged files should be saved to. _Required_.
PHONE_NUMBER_COUNTRY              | Country code for phone number formatting. _Default_: US.
PORT                              | Port for Heroku servers.
PUBLIC_DIR                        | Directory path server should use to serve files. _Required_.
ROLLBAR_CLIENT_TOKEN              | Client token for Rollbar error tracking.
ROLLBAR_ACCESS_TOKEN              | Access token for Rollbar error tracking.
ROLLBAR_ENDPOINT                  | Endpoint URL for Rollbar error tracking.
SESSION_SECRET                    | Unique key used to encrypt sessions. _Required_.
SUPPRESS_SELF_INVITE              | Boolean value to prevent self-invitations. Recommend setting before making sites available to public. _Default_: false.
TWILIO_API_KEY                    | Twilio API key. Required if using Twilio.
TWILIO_APPLICATION_SID            | Twilio application ID. Required if using Twilio.
TWILIO_AUTH_TOKEN                 | Twilio auth token. Required if using Twilio.
TWILIO_MESSAGE_SERVICE_SID        | Twilio message service ID. Required if using Twilio.
TWILIO_STATUS_CALLBACK_URL        | URL for Twilio status callbacks. Should end with `/twilio-message-report`, e.g. `https://example.org/twilio-message-report`. Required if using Twilio.
WEBPACK_HOST                      | Host domain or IP for Webpack development server. _Default_: 127.0.0.1.
WEBPACK_PORT                      | Port for Webpack development server. _Defaut_: 3000.
