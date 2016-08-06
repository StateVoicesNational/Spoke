import 'babel-polyfill'
import bodyParser from 'body-parser'
import express from 'express'
import appRenderer from './middleware/app-renderer'
import { apolloServer } from 'apollo-server'
import { schema, resolvers } from './api/schema'
import mocks from './api/mocks'
import { createLoaders, User } from './models'
import passport from 'passport'
import cookieSession from 'cookie-session'
import setupAuth0Passport from './setup-auth0-passport'
import wrap from './wrap'
import { getFormattedPhoneNumber, log } from '../lib'
import { handleIncomingMessage } from './api/lib/plivo'
import { seedZipCodes } from './seeds/seed-zip-codes'

process.on('uncaughtException', (ex) => {
  log.error(ex)
  process.exit(1)
})
const DEBUG = process.env.NODE_ENV === 'development'
setupAuth0Passport()
seedZipCodes()

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

app.post('/plivo', (req, res) => {
  const messageId = handleIncomingMessage(req.body)
  res.send(messageId)
})

app.post('/plivo-message-report', (req, res) => {
  console.log('Message send report', req.body)
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
        first_name: req.user._json.user_metadata.given_name,
        last_name: req.user._json.user_metadata.family_name,
        cell: req.user._json.user_metadata.cell,
        email: req.user._json.email,
        assigned_cell: ''
      })
    }
    res.redirect(req.query.state || '/')
  })
)
app.use('/graphql', apolloServer((req) => ({
  graphiql: true,
  pretty: true,
  schema,
  mocks,
  resolvers,
  context: {
    loaders: createLoaders(),
    user: req.user
  },
  printErrors: true,
  allowUndefinedInResolve: false
})))


// This middleware should be last. Return the React app only if no other route is hit.
app.use(appRenderer)
app.listen(port, () => {
  log.info(`Node app is running on port ${port}`)
})
