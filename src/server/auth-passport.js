import passport from 'passport'
import Auth0Strategy from 'passport-auth0'
import AuthHasher from 'passport-local-authenticate'
import { Strategy as LocalStrategy } from 'passport-local'
import { userLoggedIn } from './models/cacheable_queries'
import { User, Invite, Organization } from './models'
import wrap from './wrap'

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
    const user = await userLoggedIn('auth0_id', id)
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
}

export function setupLocalAuthPassport() {
  const strategy = new LocalStrategy({
    usernameField: 'email',
    passReqToCallback: true
  }, wrap(async (req, username, password, done) => {
    const lowerCaseEmail = username.toLowerCase()
    const existingUser = await User.filter({ email: lowerCaseEmail })
    const nextUrl = req.body.nextUrl || ''
    const uuidMatch = nextUrl.match(/\w{9}-(\w{4}\-){3}\w{12}/)

    if (uuidMatch) {
      let validUUID
      if (nextUrl.includes('join')) {
        validUUID = await Organization.filter({ uuid: uuidMatch[0] })
      } else {
        validUUID = await Invite.filter({ hash: uuidMatch[0] })
      }
      if (!validUUID) {
        return done(null, false)
      }
    }

    switch (req.body.authType) {
      case 'login':
        if (existingUser.length > 0) {
          const pwFieldSplit = existingUser[0].auth0_id.split('|')
          const hashed = {
            salt: pwFieldSplit[1],
            hash: pwFieldSplit[2]
          }
          return AuthHasher.verify(
            password, hashed,
            (err, verified) => (verified
              ? done(null, existingUser[0])
              : done(null, false, 'Invalid username or password'))
          )
        }
        return done(null, false)
      case 'signup':
        // Verify user doesn't already exist
        if (existingUser.length > 0 && existingUser[0].email === lowerCaseEmail) {
          return done(null, false, 'That email is taken.')
        }

        // Verify password and password confirm fields match
        if (password !== req.body.passwordConfirm) {
          return done(null, false, 'Passwords don\'t match.')
        }

        // create the user
        return AuthHasher.hash(password, async function (err, hashed) {
          // .salt and .hash
          const passwordToSave = `localauth|${hashed.salt}|${hashed.hash}`
          const user = await User.save({
            email: username,
            auth0_id: passwordToSave,
            first_name: req.body.firstName,
            last_name: req.body.lastName,
            cell: req.body.cell,
            is_superadmin: false
          })
          return done(null, user)
        })
      case 'reset':
        // TO-DO: Backend flow to reset a password.
        return done(null, false)
      default:
        return done(null, false)
    }
  }))

  passport.use(strategy)

  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser(wrap(async (id, done) => {
    const user = await userLoggedIn('id', parseInt(id, 10))
    done(null, user || false)
  }))

  return {
    loginCallback: [
      passport.authenticate('local', {
        failureRedirect: '/login'
      }),
      (req, res) => {
        res.redirect(req.body.nextUrl || '/')
      }
    ]
  }
}

export default {
  localauthexperimental: setupLocalAuthPassport,
  auth0: setupAuth0Passport
}
