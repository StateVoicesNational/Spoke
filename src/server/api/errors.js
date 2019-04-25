import { GraphQLError } from 'graphql/error'
import { r, cacheableData } from '../models'

export function authRequired(user) {
  if (!user) {
    throw new GraphQLError({
      status: 401,
      message: 'You must login to access that resource.'
    })
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
  const hasRole = await cacheableData.user.userHasRole(user, orgId, role)
  if (!hasRole) {
    throw new GraphQLError('You are not authorized to access that resource.')
  }
}

export async function assignmentRequired(user, assignmentId, assignment) {
  authRequired(user)

  if (user.is_superadmin) {
    return
  }
  if (assignment && assignment.user_id === user.id) {
    // if we are passed the full assignment object, we can test directly
    return
  }
  const userHasAssignment = await cacheableData.assignment.hasAssignment(user.id, assignmentId)
  if (!userHasAssignment) {
    throw new GraphQLError('You are not authorized to access that resource.')
  }
}

export function superAdminRequired(user) {
  authRequired(user)

  if (!user.is_superadmin) {
    throw new GraphQLError('You are not authorized to access that resource.')
  }
}
