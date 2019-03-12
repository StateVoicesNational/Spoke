import AuthHasher from 'passport-local-authenticate'
import { User, Invite, Organization } from './models'

const validUuid = async (nextUrl, uuidMatch, done) => {
  let foundUUID
  if (nextUrl.includes('join')) {
    foundUUID = await Organization.filter({ uuid: uuidMatch[0] })
  } else if (nextUrl.includes('invite')) {
    foundUUID = await Invite.filter({ hash: uuidMatch[0] })
  }
  if (foundUUID.length === 0) {
    return done(null, false, 'Invalid invite code. Contact your administrator.')
  }
}

const login = ({
  done,
  password,
  existingUser,
  nextUrl,
  uuidMatch
}) => {
  if (existingUser.length === 0) {
    return done(null, false, 'Invalid username or password')
  }

  // Verify UUID validity
  if (nextUrl) validUuid(nextUrl, uuidMatch, done)

  // Get salt and hash and verify user password
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

const signup = async ({
  done,
  lowerCaseEmail,
  password,
  existingUser,
  nextUrl,
  uuidMatch,
  reqBody
}) => {
  // Verify UUID validity
  if (nextUrl) validUuid(nextUrl, uuidMatch, done)

  // Verify user doesn't already exist
  if (existingUser.length > 0 && existingUser[0].email === lowerCaseEmail) {
    return done(null, false, 'That email is already taken.')
  }

  // Verify password and password confirm fields match
  if (password !== reqBody.passwordConfirm) {
    return done(null, false, 'Passwords don\'t match.')
  }

  // create the user
  return AuthHasher.hash(password, async function (err, hashed) {
    // .salt and .hash
    const passwordToSave = `localauth|${hashed.salt}|${hashed.hash}`
    const user = await User.save({
      email: lowerCaseEmail,
      auth0_id: passwordToSave,
      first_name: reqBody.firstName,
      last_name: reqBody.lastName,
      cell: reqBody.cell,
      is_superadmin: false
    })
    return done(null, user)
  })
}

const reset = ({
  done,
  password,
  existingUser,
  reqBody,
  uuidMatch
}) => {
  if (existingUser.length === 0) {
    return done(
      null,
      false,
      'Invalid username or password reset link. Contact your administrator.'
    )
  }

  // Get user resetHash and date of hash creation
  const pwFieldSplit = existingUser[0].auth0_id.split('|')
  const [resetHash, datetime] = [pwFieldSplit[1], pwFieldSplit[2]]

  // Verify hash was created in the last 15 mins
  const isExpired = (Date.now() - datetime) / 1000 / 60 > 15
  if (isExpired) {
    return done(
      null,
      false,
      'Password reset link has expired. Contact your administrator.'
    )
  }

  // Verify the UUID in request matches hash in DB
  if (uuidMatch[0] !== resetHash) {
    return done(
      null,
      false,
      'Invalid username or password reset link. Contact your administrator.'
    )
  }

  // Verify passwords match
  if (password !== reqBody.passwordConfirm) {
    return done(null, false, 'Passwords don\'t match.')
  }

  // Save new user password to DB
  return AuthHasher.hash(password, async function (err, hashed) {
    // .salt and .hash
    const passwordToSave = `localauth|${hashed.salt}|${hashed.hash}`
    const updatedUser = await User
      .get(existingUser[0].id)
      .update({ auth0_id: passwordToSave })
      .run()
    return done(null, updatedUser)
  })
}

export default { login, signup, reset }
