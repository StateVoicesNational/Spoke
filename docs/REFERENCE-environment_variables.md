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
DEBUG_SCALING                     | Emit console.log on events related to scaling issues. _Default_: false.
DEFAULT_SERVICE                   | Default SMS service. _Options_: twilio, nexmo.
DEV_APP_PORT                      | Port for development Webpack server. Required for development.
DST_REFERENCE_TIMEZONE            | Timezone to use to determine whether DST is in effect. If it's DST in this timezone, we assume it's DST everywhere.  _Default_: "America/New_York". (The default will work for any campaign in the US. For example, if the campaign is in Australia, use "Australia/Sydney" or some other timezone in Australia.  Note that DST is opposite in the northern and souther hemispheres.)
EMAIL_FROM                        | Email from address. _Required_.
EMAIL_HOST                        | Email server host. _Required_.
EMAIL_HOST_PASSWORD               | Email server password. _Required_.
EMAIL_HOST_PORT                   | Email server port. _Required_.
EMAIL_HOST_USER                   | Email server user. _Required_.
GRAPHQL_URL                       | Optional URL for pointing GraphQL API requests. Should end with `/graphql`, e.g. `https://example.org/graphql`. _Default_: "/graphql"
JOBS_SAME_PROCESS                 | Boolean value indicating whether jobs should be executed in the same process in which they are created (vs. processing asyncronously via worker processes). _Default_: false.
MAX_CONTACTS                      | If set each campaign can only have a maximum of the value (an integer). This is good for staging/QA/evaluation instances.  _Default_: false (i.e. there is no maximum)
MAX_CONTACTS_PER_TEXTER           | Maximum contacts that a texter can receive. This is particularly useful for dynamic assignment. If it's zero, then there is no maximum. _Default_: 0
MAX_MESSAGE_LENGTH                | The maximum size for a message that a texter can send. When you send a SMS message over 160 characters the message will be split, so you might want to set this as 160 or less if you have a high SMS-only target demographic. _Default_: 99999
NEXMO_API_KEY                     | Nexmo API key. Required if using Nexmo.
NEXMO_API_SECRET                  | Nexmo API secret. Required if using Nexmo.
NO_EXTERNAL_LINKS                 | Removes google fonts and auth0 login script -- good for development offline when you already have an auth0 session
NODE_ENV                          | Node environment type. _Options_: development, production.
NOT_IN_USA                        | A flag to affirmatively indicate the ability to use features that are discouraged or not legally usable in the United States. Consult with an attorney about the implications for doing so. _Default_: false (i.e. default assumes a USA legal context)
OUTPUT_DIR                        | Directory path for packaged files should be saved to. _Required_.
PHONE_NUMBER_COUNTRY              | Country code for phone number formatting. _Default_: US.
PORT                              | Port for Heroku servers.
PUBLIC_DIR                        | Directory path server should use to serve files. _Required_.
ROLLBAR_CLIENT_TOKEN              | Client token for Rollbar error tracking.
ROLLBAR_ACCESS_TOKEN              | Access token for Rollbar error tracking.
ROLLBAR_ENDPOINT                  | Endpoint URL for Rollbar error tracking.
SESSION_SECRET                    | Unique key used to encrypt sessions. _Required_.
SLACK_NOTIFY_URL                  | If set, then on post-install (often from deploying) a message will be posted to a slack channel's `#spoke` channel
SUPPRESS_SELF_INVITE              | Boolean value to prevent self-invitations. Recommend setting before making sites available to public. _Default_: false.
TERMS_REQUIRE                     | Require texters to accept the [Terms page](../src/containers/Terms.jsx#L85) before they can start texting. _Default_: false
TWILIO_API_KEY                    | Twilio API key. Required if using Twilio.
TWILIO_APPLICATION_SID            | Twilio application ID. Required if using Twilio.
TWILIO_AUTH_TOKEN                 | Twilio auth token. Required if using Twilio.
TWILIO_MESSAGE_SERVICE_SID        | Twilio message service ID. Required if using Twilio.
TWILIO_STATUS_CALLBACK_URL        | URL for Twilio status callbacks. Should end with `/twilio-message-report`, e.g. `https://example.org/twilio-message-report`. Required if using Twilio.
TWILIO_SQS_QUEUE_URL              | AWS SQS URL to handle incoming messages when app isn't connected to twilio
WEBPACK_HOST                      | Host domain or IP for Webpack development server. _Default_: 127.0.0.1.
WEBPACK_PORT                      | Port for Webpack development server. _Defaut_: 3000.
