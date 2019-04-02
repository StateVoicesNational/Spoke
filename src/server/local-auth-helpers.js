import AuthHasher from 'passport-local-authenticate'
import { User, Invite, Organization } from './models'

const errorMessages = {
  invalidInvite: 'Invalid invite code. Contact your administrator.',
  invalidCredentials: 'Invalid username or password',
  emailTaken: 'That email is already taken.',
  passwordsDontMatch: 'Passwords don\'t match.',
  invalidResetHash: 'Invalid username or password reset link. Contact your administrator.',
  noSamePassword: 'Old and new password can\'t be the same'
}

const validUuid = async (nextUrl, uuidMatch) => {
  let foundUUID
  if (nextUrl.includes('join')) {
    foundUUID = await Organization.filter({ uuid: uuidMatch[0] })
  } else if (nextUrl.includes('invite')) {
    foundUUID = await Invite.filter({ hash: uuidMatch[0] })
  }
  if (foundUUID.length === 0) {
    return [null, false, errorMessages.invalidInvite]
  }
}

const login = async ({
  password,
  existingUser,
  nextUrl,
  uuidMatch
}) => {
  if (existingUser.length === 0) {
    return [null, false, errorMessages.invalidCredentials]
  }

  // Verify UUID validity
  if (nextUrl) validUuid(nextUrl, uuidMatch)

  // Get salt and hash and verify user password
  const pwFieldSplit = existingUser[0].auth0_id.split('|')
  const hashed = {
    salt: pwFieldSplit[1],
    hash: pwFieldSplit[2]
  }
  return new Promise((resolve, reject) => {
    AuthHasher.verify(
      password, hashed,
      (err, verified) => {
        if (err) reject(err)
        if (verified) {
          resolve([null, existingUser[0]])
        }
        resolve([null, false, errorMessages.invalidCredentials])
      }
    )
  })
}

const signup = async ({
  lowerCaseEmail,
  password,
  existingUser,
  nextUrl,
  uuidMatch,
  reqBody
}) => {
  // Verify UUID validity
  if (nextUrl) validUuid(nextUrl, uuidMatch)

  // Verify user doesn't already exist
  if (existingUser.length > 0 && existingUser[0].email === lowerCaseEmail) {
    return [null, false, errorMessages.emailTaken]
  }

  // Verify password and password confirm fields match
  if (password !== reqBody.passwordConfirm) {
    return [null, false, errorMessages.passwordsDontMatch]
  }

  // create the user
  return new Promise((resolve, reject) => {
    AuthHasher.hash(password, async function (err, hashed) {
      if (err) reject(err)
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
      resolve([null, user])
    })
  })
}

const reset = ({
  password,
  existingUser,
  reqBody,
  uuidMatch
}) => {
  if (existingUser.length === 0) {
    return [null, false, errorMessages.invalidResetHash]
  }

  // Get user resetHash and date of hash creation
  const pwFieldSplit = existingUser[0].auth0_id.split('|')
  const [resetHash, datetime] = [pwFieldSplit[1], pwFieldSplit[2]]

  // Verify hash was created in the last 15 mins
  const isExpired = (Date.now() - datetime) / 1000 / 60 > 15
  if (isExpired) {
    return [null, false, errorMessages.invalidResetHash]
  }

  // Verify the UUID in request matches hash in DB
  if (uuidMatch[0] !== resetHash) {
    return [null, false, errorMessages.invalidResetHash]
  }

  // Verify passwords match
  if (password !== reqBody.passwordConfirm) {
    return [null, false, errorMessages.passwordsDontMatch]
  }

  // Save new user password to DB
  return new Promise((resolve, reject) => {
    AuthHasher.hash(password, async function (err, hashed) {
      if (err) reject(err)
      // .salt and .hash
      const passwordToSave = `localauth|${hashed.salt}|${hashed.hash}`
      const updatedUser = await User
        .get(existingUser[0].id)
        .update({ auth0_id: passwordToSave })
        .run()
      resolve([null, updatedUser])
    })
  })
}

// Only used in the changeUserPassword GraphQl mutation
export const change = ({
  user,
  password,
  newPassword,
  passwordConfirm
}) => {
  const pwFieldSplit = user.auth0_id.split('|')
  const hashedPassword = {
    salt: pwFieldSplit[1],
    hash: pwFieldSplit[2]
  }

  // Verify password and password confirm fields match
  if (newPassword !== passwordConfirm) {
    throw new Error(errorMessages.passwordsDontMatch)
  }

  // Verify old and new passwords are different
  if (password === newPassword) {
    throw new Error(errorMessages.noSamePassword)
  }

  return new Promise((resolve, reject) => {
    AuthHasher.verify(
      password, hashedPassword,
      (error, verified) => {
        if (error) return reject(error)
        if (!verified) return reject(errorMessages.invalidCredentials)
        return AuthHasher.hash(newPassword, async function (err, hashed) {
          if (err) reject(err)
          // .salt and .hash
          const passwordToSave = `localauth|${hashed.salt}|${hashed.hash}`
          const updatedUser = await User
            .get(user.id)
            .update({ auth0_id: passwordToSave })
            .run()
          resolve(updatedUser)
        })
      }
    )
  })
}
export default { login, signup, reset }
