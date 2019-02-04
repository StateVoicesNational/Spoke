import passport from 'passport'
import Auth0Strategy from 'passport-auth0'
import AuthHasher from 'passport-local-authenticate'
import { Strategy as LocalStrategy } from 'passport-local'
import { userLoggedIn } from './models/cacheable_queries'
import { User } from './models'
import wrap from './wrap'
import parseBaseURL from '../lib/parse-base-url'

export function setupAuth0Passport() {
  const strategy = new Auth0Strategy({
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: `${parseBaseURL()}/login-callback`
  }, (accessToken, refreshToken, extraParams, profile, done) => done(null, profile)
  )

  passport.use(strategy)

  passport.serializeUser((user, done) => {
    // This is the Auth0 user object, not the db one
    const auth0Id = (user.id || user._json.sub)
    done(null, auth0Id)
  })

  passport.deserializeUser(wrap(async (id, done) => {
    // add new cacheable query
    const user = await userLoggedIn(id)
    done(null, user || false)
  }))

  return [passport.authenticate('auth0', {
    failureRedirect: '/login'
  }), wrap(async (req, res) => {
    const auth0Id = (req.user && (req.user.id
                                  || req.user._json.sub))
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
        first_name: userMetadata.given_name || '',
        // eslint-disable-next-line no-underscore-dangle
        last_name: userMetadata.family_name || '',
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

export function setupLocalAuthPassport() {
  const strategy = new LocalStrategy({
    usernameField: 'email',
    passwordField: 'auth0_id' // using the legacy fieldname for password
  }, function (username, password, done) {
    User.filter({ email: username }, function (err, user) {
      if (err) { return done(err) }
      if (!user) { return done(null, false) }

        // AuthHasher.hash(password, function(err, hashed) {
        // const passwordToSave = `${hashed.salt}|${hashed.hash}`
        // .salt and .hash
        // });
      const pwFieldSplit = user.auth0_id.split('|')
      const hashed = {
        salt: pwFieldSplit[0],
        hash: pwFieldSplit[1]
      }
      AuthHasher.verify(password, hashed, function (err, verified) {
        if (verified) {
          return done(null, false)
        } else {
          done(null, user)
        }
      })
    })
  }
  )
  passport.use(strategy)

  passport.serializeUser((user, done) => {
    done(null, user.id)
  })
  passport.deserializeUser(wrap(async (id, done) => {
    const user = await User.filter({ id })
    done(null, user[0] || false)
  }))

  return null // no loginCallback
}
