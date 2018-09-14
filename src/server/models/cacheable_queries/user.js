import { r } from '../../models'

import { isRoleGreater } from '../../../lib/permissions'
import { organizationCache } from './organization'

/*
KEY: texterauth-${authId}
- id: type.string(),
- auth0_id: requiredString().stopReference(),
- first_name: requiredString(),
- last_name: requiredString(),
- cell: requiredString(),
- email: requiredString(),
- created_at: timestamp(),
- assigned_cell: type.string(),
- is_superadmin: type.boolean(),
- terms: type.boolean().default(false)

HASH texterinfo-<userId>
key = orgId
value = highest_role:org_name

QUERYS:
userHasRole(userId, orgId, acceptableRoles) -> boolean
userLoggedIn(authId) -> user object
currentEditors(campaign, user) -> string
userOrgsWithRole(role, user.id) -> organization list
*/


const userRoleKey = (userId) => `${process.env.CACHE_PREFIX || ''}texterinfo-${userId}`
const userAuthKey = (authId) => `${process.env.CACHE_PREFIX || ''}texterauth-${authId}`

const getHighestRolesPerOrg = (userOrgs) => {
  const highestRolesPerOrg = {}
  userOrgs.forEach(userOrg => {
    const orgId = userOrg.organization_id
    const orgRole = userOrg.role
    const orgName = userOrg.name

    const orgIdPresent = Object.prototype.hasOwnProperty.call(
      highestRolesPerOrg, orgId
    )
    const currentRoleGreater = isRoleGreater(
      orgRole, highestRolesPerOrg[orgId].role
    )

    if (orgIdPresent && currentRoleGreater) {
      highestRolesPerOrg[orgId].role = orgRole
    } else {
      highestRolesPerOrg[orgId] = { id: orgId, role: orgRole, name: orgName }
    }
  })
  return highestRolesPerOrg
}

const dbLoadUserRoles = async (userId) => {
  const userOrgs = await r.knex('user_organization')
    .where('user_id', userId)
    .join('organization', 'user_organization.organization_id', 'organization.id')
    .select('user_organization.role', 'user_organization.organization_id', 'organization.name')

  const highestRolesPerOrg = getHighestRolesPerOrg(userOrgs)

  if (r.redis) {
    Object.values(highestRolesPerOrg).forEach(highestRole => {
      r.redis.hsetAsync(
        userRoleKey(userId),
        highestRole.id,
        `${highestRole.role}:${highestRole.name}`
      )
    })
  }

  return highestRolesPerOrg
}

const dbLoadUserAuth = async (authId) => {
  const userAuth = await r.knex('user')
    .where('auth0_id', authId)
    .select('*')
    .first()

  if (r.redis && userAuth) {
    const authKey = userAuthKey(authId)
    await r.redis.multi()
      .set(authKey, JSON.stringify(userAuth))
      .expire(authKey, 86400)
      .execAsync()
    dbLoadUserRoles(userAuth.id)
  }
  return userAuth
}

const userHasRole = async (userId, orgId, acceptableRoles) => {
  if (r.redis) {
    // cached approach
    const userKey = `texterinfo-${userId}`
    let highestRole = await r.redis.hgetAsync(userKey, orgId)
    if (!highestRole) {
      // need to get it from db, and then cache it
      highestRole = await dbLoadUserRoles(userId)
    }
    highestRole = highestRole.split(':')[0]
    return (acceptableRoles.indexOf(highestRole) >= 0)
  }
  // regular DB approach
  const userHasRoleDb = await r.getCount(
    r.knex('user_organization')
      .where({ user_id: userId,
        organization_id: orgId })
      .whereIn('role', acceptableRoles)
  )
  return userHasRoleDb
}

const userLoggedIn = async (authId) => {
  const authKey = `texterauth-${authId}`

  if (r.redis) {
    const cachedAuth = await r.redis.getAsync(authKey)
    if (cachedAuth) {
      return JSON.parse(cachedAuth)
    }
  }

  const userAuth = await dbLoadUserAuth(authId)
  return userAuth
}

const userCache = {
  loadWithAuthId: async () => {
    // placeholder
  },
  userOrgsWithRole: async () => {
    // placeholder
  },
  userHasRole,
  userLoggedIn
}

export default userCache
