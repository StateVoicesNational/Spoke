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
    const mappedHighestRoles = Object.values(highestRolesPerOrg).reduce((acc, orgRole) => {
      acc.push(orgRole.id, `${orgRole.role}:${orgRole.name}`)
      return acc
    }, [])

    await r.redis.multi()
      .del(userRoleKey(userId))
      .hmset(userRoleKey(userId), ...mappedHighestRoles)
      .execAsync()
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
    await dbLoadUserRoles(userAuth.id)
  }
  return userAuth
}

const userHasRole = async (userId, orgId, acceptableRoles) => {
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
  userLoggedIn
}

export default userCache
