import { r } from '../../models'

import { getHighestRole } from '../../../lib/permissions'

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

export async function logoutUser(userId) {
  const userKey = `texterinfo-${userId}`
  if (r.redis) {
    r.redis.del(userKey)
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
      .execAsync()
  }
  return userAuth
}

export async function currentEditors(redis, campaign, user) {
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
