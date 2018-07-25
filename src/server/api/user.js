import { mapFieldsToModel } from './lib/utils'
import { r, User } from '../models'
import { rolesAtLeast } from '../../lib/permissions'

export function buildUserOrganizationQuery(queryParam, organizationId, role) {
  const roleFilter = role ? { role } : {}

  return queryParam
    .from('user_organization')
    .innerJoin('user', 'user_organization.user_id', 'user.id')
    .where(roleFilter)
    .where({ 'user_organization.organization_id': organizationId })
    .distinct()
}

export const resolvers = {
  User: {
    ...mapFieldsToModel([
      'id',
      'firstName',
      'lastName',
      'email',
      'cell',
      'assignedCell',
      'terms'
    ], User),
    displayName: (user) => `${user.first_name} ${user.last_name}`,
    assignment: async (user, { campaignId }) => r.table('assignment')
      .getAll(user.id, { index: 'user_id' })
      .filter({ campaign_id: campaignId })
      .limit(1)(0)
      .default(null),
    organizations: async (user, { role }) => {
      if (!user || !user.id) {
        return []
      }
      let orgs = r.knex('user_organization')
        .where({ user_id: user.id })
      if (role) {
        const matchingRoles = rolesAtLeast(role)
        orgs = orgs.whereIn('role', matchingRoles)
      }
      return orgs.rightJoin('organization', 'user_organization.organization_id', 'organization.id').distinct()
    },
    roles: async(user, { organizationId }) => (
      r.table('user_organization')
        .getAll([organizationId, user.id], { index: 'organization_user' })
        .pluck('role')('role')
    ),
    todos: async (user, { organizationId }) =>
      r.table('assignment')
        .getAll(user.id, { index: 'user_id' })
        .eqJoin('campaign_id', r.table('campaign'))
        .filter({ 'is_started': true,
                 'organization_id': organizationId,
                 'is_archived': false }
               )('left')

  }
}
