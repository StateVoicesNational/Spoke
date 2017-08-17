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

async function hasRole(userId, orgId, role) {
  if (role) {
    const hasRole = await r.table('user_organization').filter({
      user_id: userId,
      organization_id: orgId,
      role: role
    }).limit(1)(0).default(null)
    if (hasRole) {
      return true
    }
  } else {
    return null
  }
}

async function hasARole(userId, orgId, roles) {
  // returns true if user has any role in roles array
  let userHasRole = false
  if (roles && roles.length > 0) {
    const results = await Promise.all(roles.map(async (role) => {
      return await hasRole(userId, orgId, role)
    }))
    .then(results => {
      results.forEach((result) => {
        if (result) {
          userHasRole = true
        }
      })
    })
    return userHasRole
  }
}

export async function accessRequired(user, orgId, role, roles = [], allowSuperadmin = false) {
  // pass a single role OR an array of roles

  authRequired(user)

  if (allowSuperadmin && user.is_superadmin) {
    return
  }

  const [userHasRole, userHasRoles] = await Promise.all(
    [hasRole(user.id, orgId, role), hasARole(user.id, orgId, roles)]
  )      
  if (!(userHasRole || userHasRoles)) {
    throw new GraphQLError({
      status: 403,
      message: 'You are not authorized to access that resource.'
    })
  }
  
}

export async function assignmentRequired(user, assignmentId, contactId, campaignId) {
  // checks to see if texter is assigned contact in current campaign
  // select * 
  // from assignment 
  // join campaign_contact on assignment.id = campaign_contact.assignment_id
  // where assignment.user_id = user.id
  // and assignment.campaign_id = campaignId

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
