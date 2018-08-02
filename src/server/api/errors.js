import { GraphQLError } from 'graphql/error'
import { r } from '../models'
import { userHasRole } from '../models/cacheable-queries'

const accessHierarchy = ['TEXTER', 'SUPERVOLUNTEER', 'ADMIN', 'OWNER']

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
  const acceptableRoles = accessHierarchy.slice(accessHierarchy.indexOf(role))
  const hasRole = await userHasRole(user.id, orgId, acceptableRoles)
  if (!hasRole) {
    throw new GraphQLError('You are not authorized to access that resource.')
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
    throw new GraphQLError('You are not authorized to access that resource.')
  }
}

export function superAdminRequired(user) {
  authRequired(user)

  if (!user.is_superadmin) {
    throw new GraphQLError('You are not authorized to access that resource.')
  }
}

export function hasOsdiConfigured({features}) {
  const err = new GraphQLError({
    status: 400,
    message: 'Your organization is not configured with OSDI. Please contact your administrator for help.'
  })
  if (!features) throw err
  const { osdiEnabled, osdiApiUrl, osdiApiToken } = JSON.parse(features)
  if (!(osdiEnabled && osdiApiUrl && osdiApiToken)) {
    throw err
  }
}
