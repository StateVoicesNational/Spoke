import passport from 'passport'
import Auth0Strategy from 'passport-auth0'
import AuthHasher from 'passport-local-authenticate'
import { Strategy as LocalStrategy } from 'passport-local'
import { User } from './models'
import wrap from './wrap'

export function setupAuth0Passport() {
  const strategy = new Auth0Strategy({
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: process.env.AUTH0_LOGIN_CALLBACK
  }, (accessToken, refreshToken, extraParams, profile, done) => done(null, profile)
  )

  passport.use(strategy)

  passport.serializeUser((user, done) => {
    // This is the Auth0 user object, not the db one
    done(null, user.id)
  })

  passport.deserializeUser(wrap(async (id, done) => {
    const user = await User.filter({ auth0_id: id })
    done(null, user[0] || false)
  }))

  return [passport.authenticate('auth0', {
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
