import passport from 'passport'
import Auth0Strategy from 'passport-auth0'
import { User } from './models'
import wrap from './wrap'

function setupAuth0Passport() {
  const strategy = new Auth0Strategy({
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: process.env.AUTH0_LOGIN_CALLBACK
  }, (accessToken, refreshToken, extraParams, profile, done) => done(null, profile)
  )

  passport.use(strategy)

  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser(wrap(async (id, done) => {
    const user = await User.filter({ auth0_id: id })
    done(null, user[0])
  }))
}

export default setupAuth0Passport
