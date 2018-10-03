import { r } from '../../models'
import { isRoleGreater } from '../../../lib/permissions'

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

HASH texterroles-<userId>
key = orgId
value = highest_role:org_name

QUERYS:
userHasRole(userId, orgId, acceptableRoles) -> boolean
userLoggedIn(authId) -> user object
currentEditors(campaign, user) -> string
userOrgsWithRole(role, user.id) -> organization list
*/

const userRoleKey = (userId) => `${process.env.CACHE_PREFIX || ''}texterroles-${userId}`
const userAuthKey = (authId) => `${process.env.CACHE_PREFIX || ''}texterauth-${authId}`

export const accessHierarchy = ['TEXTER', 'SUPERVOLUNTEER', 'ADMIN', 'OWNER']

const getHighestRolesPerOrg = (userOrgs) => {
  const highestRolesPerOrg = {}
  userOrgs.forEach(userOrg => {
    const orgId = userOrg.organization_id
    const orgRole = userOrg.role
    const orgName = userOrg.name

    if (highestRolesPerOrg[orgId]) {
      if (isRoleGreater(
        orgRole, highestRolesPerOrg[orgId].role
      )) {
        highestRolesPerOrg[orgId].role = orgRole
      }
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
    // delete keys first
    // pass all values to hset instead of looping
    const key = userRoleKey(userId)
    const mappedHighestRoles = Object.values(highestRolesPerOrg).reduce((acc, orgRole) => {
      acc.push(orgRole.id, `${orgRole.role}:${orgRole.name}`)
      return acc
    }, [])
    if (mappedHighestRoles.length) {
      await r.redis.multi()
        .del(key)
        .hmset(key, ...mappedHighestRoles)
        .execAsync()
    } else {
      await r.redis.delAsync(key)
    }
  }

  return highestRolesPerOrg
}

const loadUserRoles = async (userId) => {
  if (r.redis) {
    const roles = await r.redis.hgetallAsync(userRoleKey(userId))
    // console.log('cached roles', roles)
    if (roles) {
      const userRoles = {}
      Object.keys(roles).forEach(orgId => {
        const [highestRole, orgName] = roles[orgId].split(':')
        userRoles[orgId] = { id: orgId, name: orgName, role: highestRole }
      })
      return userRoles
    }
  }
  return await dbLoadUserRoles(userId)
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
    await dbLoadUserRoles(userAuth.id)
  }
  return userAuth
}

const userOrgs = async (userId, role) => {
  const acceptableRoles = (role
                           ? accessHierarchy.slice(accessHierarchy.indexOf(role))
                           : [...accessHierarchy])
  const orgRoles = await loadUserRoles(userId)
  const matchedOrgs = Object.keys(orgRoles).filter(orgId => (
    acceptableRoles.indexOf(orgRoles[orgId].role) !== -1
  ))
  return matchedOrgs.map(orgId => orgRoles[orgId])
}

const orgRoles = async (userId, orgId) => {
  const orgRolesDict = await loadUserRoles(userId)
  if (orgId in orgRolesDict) {
    return accessHierarchy.slice(
      0, 1 + accessHierarchy.indexOf(orgRolesDict[orgId].role))
  }
  return []
}

const userHasRole = async (userId, orgId, role) => {
  const acceptableRoles = accessHierarchy.slice(accessHierarchy.indexOf(role))
  if (r.redis) {
    // cached approach
    const userKey = userRoleKey(userId)
    const cacheRoleResult = await r.redis.hgetAsync(userKey, orgId)
    let highestRole
    if (cacheRoleResult) {
      highestRole = cacheRoleResult.split(':')[0]
    } else {
      // need to get it from db, and then cache it
      const highestRoles = await dbLoadUserRoles(userId)
      highestRole = highestRoles[orgId] && highestRoles[orgId].role
    }
    return (highestRole && acceptableRoles.indexOf(highestRole) >= 0)
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
  const authKey = userAuthKey(authId)

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
  userHasRole,
  userLoggedIn,
  userOrgs,
  orgRoles,
  clearUser: async (userId, authId) => {
    if (r.redis) {
      await r.redis.delAsync(userRoleKey(userId))
      if (authId) {
        await r.redis.delAsync(userAuthKey(authId))
      }
    }
  }
}

export default userCache
