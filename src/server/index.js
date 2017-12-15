import 'babel-polyfill'
import bodyParser from 'body-parser'
import express from 'express'
import appRenderer from './middleware/app-renderer'
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express'
import { makeExecutableSchema, addMockFunctionsToSchema } from 'graphql-tools'
import { schema, resolvers } from './api/schema'
import mocks from './api/mocks'
import { createLoaders, User, r } from './models'
import passport from 'passport'
import cookieSession from 'cookie-session'
import setupAuth0Passport from './setup-auth0-passport'
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

setupAuth0Passport()
if (!process.env.SUPPRESS_SEED_CALLS) {
  seedZipCodes()
}
if (!process.env.SUPPRESS_MIGRATIONS) {
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
// app.get('/incomingmessages', (req, res) => {
//   client.sms.messages.list(function(err, data) {
//     const listOfMessages = data.sms_messages
//     listOfMessages.forEach(function(message){
//       if(message.direction == "inbound"){
//         return console.log(message.body)
//       }
//     })
//   })
// })

app.get('/allmessages/:organizationId', wrap(async (req, res) => {
  const orgId = req.params.organizationId
  const membership = await r.knex('user_organization')
    .where({
      user_id: req.user.id,
      organization_id: orgId,
      role: 'ADMIN'
    })
    .first()

  if (typeof membership === 'undefined') {
    // Current user is not admin of the requested org, can't access messages.
    res.json([])
  }
  else {
    const messages = await r.knex('message')
      .select(
          'message.id',
          'message.text',
          'message.user_number',
          'message.contact_number',
          'message.created_at'
      )
      .join('assignment', 'message.assignment_id', 'assignment.id')
      .join('campaign', 'assignment.campaign_id', 'campaign.id')
      .where('campaign.organization_id', orgId)
      .where('message.is_from_contact', true)
      .orderBy('message.created_at', 'desc')
    return res.json(messages)
  }
}))

app.get('/logout-callback', (req, res) => {
  req.logOut()
  res.redirect('/')
})
app.get('/login-callback',
  passport.authenticate('auth0', {
    failureRedirect: '/login'
  }), wrap(async (req, res) => {
    if (!req.user || !req.user.id) {
      throw new Error('Null user in login callback')
    }
    const existingUser = await User.filter({ auth0_id: req.user.id })

    if (existingUser.length === 0) {
      await User.save({
        auth0_id: req.user.id,
        // eslint-disable-next-line no-underscore-dangle
        first_name: req.user._json.user_metadata.given_name,
        // eslint-disable-next-line no-underscore-dangle
        last_name: req.user._json.user_metadata.family_name,
        // eslint-disable-next-line no-underscore-dangle
        cell: req.user._json.user_metadata.cell,
        // eslint-disable-next-line no-underscore-dangle
        email: req.user._json.email,
        is_superadmin: false
      })
      res.redirect(req.query.state || 'terms')
      return
    }
    res.redirect(req.query.state || '/')
    return
  })
)

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
    user: request.user
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
