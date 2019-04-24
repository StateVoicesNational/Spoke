import passport from 'passport'
import Auth0Strategy from 'passport-auth0'
import { Strategy as LocalStrategy } from 'passport-local'
import { User, cacheableData } from './models'
import localAuthHelpers from './local-auth-helpers'
import wrap from './wrap'
import { capitalizeWord } from './api/lib/utils'


export function setupAuth0Passport() {
  const strategy = new Auth0Strategy({
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/login-callback`
  }, (accessToken, refreshToken, extraParams, profile, done) => done(null, profile)
  )

  passport.use(strategy)

  passport.serializeUser((user, done) => {
    // This is the Auth0 user object, not the db one
    // eslint-disable-next-line no-underscore-dangle
    const auth0Id = (user.id || user._json.sub)
    done(null, auth0Id)
  })

  passport.deserializeUser(wrap(async (id, done) => {
    // add new cacheable query
    const user = await cacheableData.user.userLoggedIn('auth0_id', id)
    done(null, user || false)
  }))

  return {
    loginCallback: [
      passport.authenticate('auth0', { failureRedirect: '/login' }),
      wrap(async (req, res) => {
        // eslint-disable-next-line no-underscore-dangle
        const auth0Id = (req.user && (req.user.id || req.user._json.sub))
        if (!auth0Id) {
          throw new Error('Null user in login callback')
        }
        const existingUser = await User.filter({ auth0_id: auth0Id })

        if (existingUser.length === 0) {
          const userMetadata = (
            // eslint-disable-next-line no-underscore-dangle
            req.user._json['https://spoke/user_metadata']
            // eslint-disable-next-line no-underscore-dangle
            || req.user._json.user_metadata
            || {})
          const userData = {
            auth0_id: auth0Id,
            // eslint-disable-next-line no-underscore-dangle
            first_name: capitalizeWord(userMetadata.given_name) || '',
            // eslint-disable-next-line no-underscore-dangle
            last_name: capitalizeWord(userMetadata.family_name) || '',
            cell: userMetadata.cell || '',
            // eslint-disable-next-line no-underscore-dangle
            email: req.user._json.email,
            is_superadmin: false
          }
          await User.save(userData)
          res.redirect(req.query.state || 'terms')
          return
        }
        res.redirect(req.query.state || '/')
        return
      })]
  }
}

export function setupLocalAuthPassport() {
  const strategy = new LocalStrategy({
    usernameField: 'email',
    passReqToCallback: true
  }, wrap(async (req, username, password, done) => {
    const lowerCaseEmail = username.toLowerCase()
    const existingUser = await User.filter({ email: lowerCaseEmail })
    const nextUrl = req.body.nextUrl || ''
    const uuidMatch = nextUrl.match(/\w{8}-(\w{4}\-){3}\w{12}/)

    // Run login, signup, or reset functions based on request data
    if (req.body.authType && !localAuthHelpers[req.body.authType]) {
      return done(null, false)
    }
    try {
      const user = await localAuthHelpers[req.body.authType]({
        lowerCaseEmail,
        password,
        existingUser,
        nextUrl,
        uuidMatch,
        reqBody: req.body
      })
      return done(null, user)
    } catch (err) {
      return done(null, false, err.message)
    }
  }))

  passport.use(strategy)

  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser(wrap(async (id, done) => {
    const user = await cacheableData.user.userLoggedIn('id', parseInt(id, 10))
    done(null, user || false)
  }))

  return {
    loginCallback: [
      passport.authenticate('local'),
      (req, res) => {
        res.redirect(req.body.nextUrl || '/')
      }
    ]
  }
}

export default {
  local: setupLocalAuthPassport,
  auth0: setupAuth0Passport
}
