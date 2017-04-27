# Spoke

Spoke is an open source text-distribution tool for organizations to mobilize supporters and members into action. Spoke allows you to upload phone numbers, customize scripts and assign volunteers to communicate with supporters while allowing organizations to manage the process.

## Note

This is generated from [react-apollo-starter-kit](https://github.com/saikat/react-apollo-starter-kit).  Look at that project's README for info on some of the libraries used.

## Getting started

1. [Install RethinkDB](https://www.rethinkdb.com/docs/install/osx/)
1. `npm install`
1. `cp .env.example .env`
1. Thinky can autocreate tables/dbs but you'll prob want to this on startup.
Start `rethinkdb` and then Run `rethinkdb && ./dev-tools/babel-run-with-env. ./dev-tools/db-startup.js` (You'll see all the tables and indexes at http://localhost:8080/#tables). Then stop rethinkdb (since `npm run dev` will also try to start rethinkdb)
1. Create an [Auth0](auth0.com) account. (Note: we'd recommend getting rid of this Auth0 requirement but for now it's necessary.) In your Auth0 account, go to Settings - Clients and grab Client ID, Client Secret, and your Auth0 domain (should look like xxx.auth0.com) for your `.env` file (AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_DOMAIN respectively). Also need domain. Also add the login callback URL (specified in `.env` and defaulting to `http://localhost:3000/login-callback` ) to Allowed Callback URLs in your Auth0 account settings.
1. Run `npm run dev` to start the app
1. Go to `localhost:3000` to load the app
1. Because Spoke was invite-only you need to generate an invite:
Go to the RethinkDB data explorer at http://localhost:8080/#dataexplorer and run:
 `r.db('spokedev').table('invite').insert({is_valid: true})`
Use the generated key to visit an invite link, e.g.: http://localhost:3000/invite/e7bcc458-c8e9-4601-8999-a489e04bd45f so you can create an organization and get started.


## Important TODOS
**Because  of issues with numbers getting marked with spam, we adopted aggressive number cycling to limit the number of texts sent from a specific number. We did not implement a corresponding process to unrent the numbers before shutting down the service, so two things are a high priority before putting Spoke back into production:
1. Decide whether to keep the number cycling, since it might not be necessary on Twilio like it was on Nexmo
2. If keeping it making sure there's a corresponding process to unrent unused numbers.
3. Even if not keeping number cycling, there should be a process like this anyway to unrent numbers that haven't been used in X days anyway because volunteers come and go. However, cycling numbers every ~250 texts obviously racks up exponentially higher costs than just assigning a single number per volunteer.  **

## Helpful Dev Tips
* Go to `localhost:3000/graphql` to mess around with the GraphQL API
* Go to `localhost:8080` to use the RethinkDB admin console
* [Set up an ESLint plugin in your code editor so that you catch coding errors and follow code style guidelines more easily!](https://medium.com/planet-arkency/catch-mistakes-before-you-run-you-javascript-code-6e524c36f0c8#.oboqsse48)
* [Install the redux-devtools-extension](https://github.com/zalmoxisus/redux-devtools-extension) in Chrome to get advanced Redux debugging features.
* Right now there is a bug in Apollo (https://github.com/apollostack/react-apollo/issues/57) that means in one particular case, errors get swallowed.  If you end up with an app that is silently breaking, console.log(this.props.data) and check the errors property.


## Testing Twilio

If you need to use Twilio in development but with live keys, do the following to receive incoming replies:

1. Start ngrok
1. Visit https://www.twilio.com/console/voice/dev-tools/twiml-apps and go to the Spoke Dev app.
1. Set Request URL under "Messaging" to http://<<YOUR_NGROK>>.ngrok.io/twilio
1. In `.env` set `TWILIO_APPLICATION_ID` to the Twilio Spoke Dev application ID
1. In `.env` set `TWILIO_STATUS_CALLBACK_URL` to  http://<<YOUR_NGROK>>.ngrok.io/twilio-message-report