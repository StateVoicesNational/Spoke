import { r } from '../models'

import { getHighestRole } from '../../lib/permissions'

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
        .where({ user_id: user.id,
                 organization_id: orgId })
        .whereIn('role', acceptableRoles)
    )
    return userHasRole
  }
}

export async function userLoggedIn(authId) {
  const authKey = `texterauth-${authId}`

  if(r.redis) {
    const cachedAuth = await r.redis.getAsync(authKey)
    if(cachedAuth){
      return JSON.parse(cachedAuth)
    }
  }

  const userAuth = await r.knex('user')
    .where('auth0_id', authId )
    .select('*')
    .first()

  if(r.redis && userAuth){
    await r.redis.set(authKey, JSON.stringify(userAuth), 86400)
  }
  return userAuth
}
