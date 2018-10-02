import 'babel-polyfill'
import bodyParser from 'body-parser'
import express from 'express'
import appRenderer from './middleware/app-renderer'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express'
import { makeExecutableSchema, addMockFunctionsToSchema } from 'graphql-tools'
import { resolvers } from './api/schema'
import { schema } from '../api/schema'
import { accessRequired } from './api/errors'
import mocks from './api/mocks'
import { createLoaders, createTablesIfNecessary } from './models'
import passport from 'passport'
import cookieSession from 'cookie-session'
import { setupAuth0Passport } from './auth-passport'
import wrap from './wrap'
import { log } from '../lib'
import nexmo from './api/lib/nexmo'
import twilio from './api/lib/twilio'
import { seedZipCodes } from './seeds/seed-zip-codes'
import { runMigrations } from '../migrations'
import { setupUserNotificationObservers } from './notifications'
import { TwimlResponse } from 'twilio'

process.on('uncaughtException', (ex) => {
  log.error(ex)
  process.exit(1)
})
const DEBUG = process.env.NODE_ENV === 'development'

const loginCallbacks = setupAuth0Passport()
if (!process.env.PASSPORT_STRATEGY) {
  // default to legacy Auth0 choice

} else {

}

if (!process.env.SUPPRESS_SEED_CALLS) {
  seedZipCodes()
}

if (!process.env.SUPPRESS_DATABASE_AUTOCREATE) {
  createTablesIfNecessary().then((didCreate) => {
    // seed above won't have succeeded if we needed to create first
    if (didCreate && !process.env.SUPPRESS_SEED_CALLS) {
      seedZipCodes()
    }
    if (!didCreate && !process.env.SUPPRESS_MIGRATIONS) {
      runMigrations()
    }
  })
} else if (!process.env.SUPPRESS_MIGRATIONS) {
  runMigrations()
}

setupUserNotificationObservers()
const app = express()
// Heroku requires you to use process.env.PORT
const port = process.env.DEV_APP_PORT || process.env.PORT

// Don't rate limit heroku
app.enable('trust proxy')
if (!DEBUG) {
  app.use(express.static(process.env.PUBLIC_DIR, {
    maxAge: '180 days'
  }))
}

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: true }))

app.use(cookieSession({
  cookie: {
    httpOnly: true,
    secure: !DEBUG,
    maxAge: null
  },
  secret: process.env.SESSION_SECRET
}))
app.use(passport.initialize())
app.use(passport.session())

app.use((req, res, next) => {
  const getContext = app.get('awsContextGetter')
  if (typeof getContext === 'function') {
    const [event, context] = getContext(req, res)
    req.awsEvent = event
    req.awsContext = context
  }
  next()
})

app.post('/nexmo', wrap(async (req, res) => {
  try {
    const messageId = await nexmo.handleIncomingMessage(req.body)
    res.send(messageId)
  } catch (ex) {
    log.error(ex)
    res.send('done')
  }
}))

app.post('/twilio', twilio.webhook(), wrap(async (req, res) => {
  try {
    await twilio.handleIncomingMessage(req.body)
  } catch (ex) {
    log.error(ex)
  }

  const resp = new TwimlResponse()
  res.writeHead(200, { 'Content-Type': 'text/xml' })
  res.end(resp.toString())
}))

app.post('/nexmo-message-report', wrap(async (req, res) => {
  try {
    const body = req.body
    await nexmo.handleDeliveryReport(body)
  } catch (ex) {
    log.error(ex)
  }
  res.send('done')
}))

app.post('/twilio-message-report', wrap(async (req, res) => {
  try {
    const body = req.body
    await twilio.handleDeliveryReport(body)
  } catch (ex) {
    log.error(ex)
  }
  const resp = new TwimlResponse()
  res.writeHead(200, { 'Content-Type': 'text/xml' })
  res.end(resp.toString())
}))

// const accountSid = process.env.TWILIO_API_KEY
// const authToken = process.env.TWILIO_AUTH_TOKEN
// const client = require('twilio')(accountSid, authToken)

app.get('/logout-callback', (req, res) => {
  req.logOut()
  res.redirect('/')
})

if (loginCallbacks) {
  app.get('/login-callback', ...loginCallbacks)
}

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
  allowUndefinedInResolve: false
})
addMockFunctionsToSchema({
  schema: executableSchema,
  mocks,
  preserveResolvers: true
})

app.use('/graphql', graphqlExpress((request) => ({
  schema: executableSchema,
  context: {
    loaders: createLoaders(),
    user: request.user,
    awsContext: request.awsContext || null,
    awsEvent: request.awsEvent || null,
    remainingMilliseconds: () => (
      (request.awsContext && request.awsContext.getRemainingTimeInMillis)
      ? request.awsContext.getRemainingTimeInMillis()
      : 5 * 60 * 1000 // default saying 5 min, no matter what
    )
  }
})))
app.get('/graphiql', graphiqlExpress({
  endpointURL: '/graphql'
}))


// This middleware should be last. Return the React app only if no other route is hit.
app.use(appRenderer)


if (port) {
  app.listen(port, () => {
    log.info(`Node app is running on port ${port}`)
  })
}

export default app
