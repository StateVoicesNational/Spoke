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

export async function accessRequired(user, orgId, role) {
  authRequired(user)

  const userOrganization = await r.table('user_organization').filter({
    user_id: user.id,
    organization_id: orgId
  })
  .filter((roles) => roles('roles').contains(role))
  if (userOrganization.length === 0) {
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
