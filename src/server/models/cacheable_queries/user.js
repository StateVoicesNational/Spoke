import { r } from '../../models'

import { getHighestRole, hasRoleAtLeast } from '../../../lib/permissions'

export async function userHasRole(userId, orgId, acceptableRoles) {
  if (r.redis) {
    // cached approach
    const userKey = `texterinfo-${userId}`
    let highestRole = await r.redis.hgetAsync(userKey, orgId)
    if (!highestRole) {
      // need to get it from db, and then cache it
      const userRoles = await r.knex('user_organization')
        .where({ user_id: userId,
                 organization_id: orgId })
        .select('role')
      if (!userRoles.length) {
        return false // who is this imposter!?
      }
      highestRole = getHighestRole(userRoles.map((r) => r.role))
      await r.redis.hsetAsync(userKey, orgId, highestRole)
    }
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

async function getUserOrgInfo(userId, orgId) {
  const userOrgKey = `texterorg-${userId}-${orgId}`
  let orgInfo = await r.redis.getAsync(userOrgKey)
  if (!orgInfo) {
    const orgData = await r.knex('user_organization')
      .join('organization', 'organization.id', 'user_organization.organization_id')
      .where({
        user_id: userId,
        organization_id: orgId
      })
      .select('organization.id', 'organization.name')
      .distinct()
    await r.redis.set(userOrgKey, JSON.stringify(orgData[0]))
    return orgData[0]
  } else {
    let parsedOrgInfo = JSON.parse(orgInfo)
    return parsedOrgInfo
  }
}

export async function userOrgsWithRole(role, userId) {
  if (r.redis) {
   const userKey = `texterinfo-${userId}`
   const userOrgs = await r.redis.hgetallAsync(userKey)
   if (userOrgs) {
     const orgs = []
     const arrOrgs = []
     Object.keys(userOrgs).map(key => {
       arrOrgs.push({[key]: userOrgs[key]})
       if (hasRoleAtLeast(arrOrgs, role)) {
         orgs.push(getUserOrgInfo(userId, key))
       }
     })
     return orgs
   }
  } else {
    let orgs = r.knex.select('organization.*')
       .from('organization')
       .join('user_organization', 'organization.id', 'user_organization.organization_id')
       .where('user_organization.user_id', user.id)

     if (role) {
       const matchingRoles = rolesAtLeast(role)
       orgs = orgs.whereIn('user_organization.role', matchingRoles)
     }
     return orgs.distinct()
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

  const userAuth = await r.knex('user')
    .where('auth0_id', authId)
    .select('*')
    .first()

  if (r.redis && userAuth) {
    await r.redis.multi()
      .set(authKey, JSON.stringify(userAuth))
      .expire(authKey, 86400)
      .exec()
  }
  return userAuth
}
