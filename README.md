# Spoke

This is generated from [react-apollo-starter-kit](https://github.com/saikat/react-apollo-starter-kit).  Look at that project's README for info on some of the libraries used.

## Getting started

1. [Install RethinkDB](https://www.rethinkdb.com/docs/install/osx/)
1. `npm install`
1. `npm run dev`
1. Go to `localhost:3000` to load the app
1. Go to `localhost:3000/graphql` to mess around with the GraphQL API
1. Go to `localhost:8080` to use the RethinkDB admin console

## Helpful Dev Tips

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

