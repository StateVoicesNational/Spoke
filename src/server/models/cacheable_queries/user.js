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


const userRoleKey = (userId) => `${process.env.CACHE_PREFIX || ""}texterinfo-${userId}`

const getHighestRolesPerOrg = function(userOrgs) {
  const highestRolesPerOrg = {}
  userOrgs.forEach(userOrg => {
    const orgId = userOrg.organization_id
    const orgRole = userOrg.role
    const orgName = userOrg.name

    if (highestRolesPerOrg.hasOwnProperty(orgId) &&
      isRoleGreater(orgRole, highestRolesPerOrg[orgId].role)) {
        highestRolesPerOrg[orgId].role = orgRole
    } else {
      highestRolesPerOrg[orgId] = {id: orgId, role: orgRole, name: orgName}
    }
  })
  return highestRolesPerOrg
}

const dbLoadUserRoles = async function(userId) {
  const userOrgs = await r.knex('user_organization')
    .where('user_id', userId)
    .join('organization', 'user_organization.organization_id', 'organization.id')
    .select('user_organization.role','user_organization.organization_id', 'organization.name')

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

const dbLoadUserAuth = async function(authId) {
  const userAuth = await r.knex('user')
    .where('auth0_id', authId)
    .select('*')
    .first()

  if (r.redis && userAuth) {
    await r.redis.multi()
      .set(authKey, JSON.stringify(userAuth))
      .expire(authKey, 86400)
      .execAsync()
    dbLoadUserRoles(userAuth.id)
  }
  return userAuth
}

export async function userHasRole(userId, orgId, acceptableRoles) {
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
  } else {
    // regular DB approach
    const userHasRole = await r.getCount(
      r.knex('user_organization')
        .where({ user_id: userId,
                 organization_id: orgId })
        .whereIn('role', acceptableRoles)
    )
    return userHasRole
  }
}

export async function userLoggedIn(authId) {
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

export async function currentEditors(campaign, user) {
  // Add user ID in case of duplicate admin names
  const displayName = `${user.id}~${user.first_name} ${user.last_name}`

  await r.redis.hsetAsync(`campaign_editors_${campaign.id}`, displayName, new Date())
  await r.redis.expire(`campaign_editors_${campaign.id}`, 120)

  let editors = await r.redis.hgetallAsync(`campaign_editors_${campaign.id}`)

  // Only get editors that were active in the last 2 mins, and exclude the
  // current user
  editors = Object.entries(editors).filter(editor => {
    const rightNow = new Date()
    return rightNow - new Date(editor[1]) <= 120000 && editor[0] !== displayName
  })

  // Return a list of comma-separated names
  return editors.map(editor => {
    return editor[0].split('~')[1]
  }).join(', ')
}

export const userCache = {
  userHasRole: async () => {

  },
  loadWithAuthId: async () => {

  },
  userOrgsWithRole: async () => {

  },

}
