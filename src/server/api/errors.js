import { r } from '../models'

export function GraphQLError(errorObject) {
  const message = JSON.stringify(errorObject)
  this.name = this.constructor.name
  this.message = message
  this.stack = (new Error()).stack
}

GraphQLError.prototype = Object.create(Error.prototype)
GraphQLError.prototype.constructor = GraphQLError

export function authRequired(user) {
  if (!user) {
    throw new GraphQLError({
      status: 401,
      message: 'You must login to access that resource.'
    })
  }
}

export async function accessRequired(user, orgId, role, roles = [], allowSuperadmin = false) {
  // pass a single role OR an array of roles
  
  authRequired(user)

  if (allowSuperadmin && user.is_superadmin) {
    return
  }

  let userOrganization = false

  if (role) {
    console.log("one role")
    userOrganization = await r.table('user_organization').filter({
      user_id: user.id,
      organization_id: orgId,
      role
    }).limit(1)(0).default(null)
  }

  if (roles && roles.length > 0) {
    console.log("multiple roles")
    roles.forEach(async (role) => {
      const userHasRole = await r.table('user_organization').filter({
        user_id: user.id,
        organization_id: orgId,
        role: role
      }).limit(1)(0).default(null)
      console.log("userHasRole " + JSON.stringify(userHasRole))
      if (userHasRole) {
        console.log("user has role " + String(user.id) + " " + role)
      }
      if (!userOrganization && userHasRole) {
        console.log("!userOrganization && userHasRole")
         // debug
        userOrganization = true
      }
    })
  }
  
  console.log("userOrganization " + userOrganization)
  
  if (!userOrganization) {
    throw new GraphQLError({
      status: 403,
      message: 'You are not authorized to access that resource.'
    })
  } else {
    return
  }
}

export async function assignmentRequired(user, assignment) {
  return true
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
