import { GraphQLError } from 'graphql/error'

import { r } from '../models'

const accessHierarchy = ['TEXTER', 'SUPERVOLUNTEER', 'ADMIN', 'OWNER']

export function authRequired(user) {
  if (!user) {
    throw new GraphQLError({
      status: 401,
      message: 'You must login to access that resource.'
    })
  }
}

export async function hasRole(userId, orgId, role) {
  if (role) {
    const userHasRole = await r.table('user_organization').filter({
      user_id: userId,
      organization_id: orgId,
      role
    }).limit(1)(0).default(null)
    return userHasRole
  }
}

export async function accessRequired(user, orgId, role, allowSuperadmin = false) {
  authRequired(user)
  if (!orgId) {
    throw new Error('orgId not passed correctly to accessRequired')
  }
  if (allowSuperadmin && user.is_superadmin) {
    return
  }
  // require a permission at-or-higher than the permission requested
  const acceptableRoles = accessHierarchy.slice(accessHierarchy.indexOf(role))
  const userHasRole = await r.getCount(
    r.knex('user_organization')
      .where({ user_id: user.id,
               organization_id: orgId })
      .whereIn('role', acceptableRoles)
  )
  if (!userHasRole) {
    throw new GraphQLError({
      status: 403,
      message: 'You are not authorized to access that resource.'
    })
  }
}

export async function assignmentRequired(user, assignmentId) {
  authRequired(user)

  if (user.is_superadmin) {
    return
  }

  const [assignment] = await r.knex('assignment')
  .where({
    user_id: user.id,
    id: assignmentId
  }).limit(1)

  if (typeof assignment === 'undefined') {
    throw new GraphQLError({
      status: 403,
      message: 'You are not authorized to access that resource.'
    })
  }
}

export function superAdminRequired(user) {
  authRequired(user)

  if (!user.is_superadmin) {
    throw new GraphQLError({
      status: 403,
      message: 'You are not authorized to access that resource.'
    })
  }
}
