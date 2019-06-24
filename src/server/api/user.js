import { mapFieldsToModel } from './lib/utils'
import { r, User, cacheableData } from '../models'
import { addCampaignsFilterToQuery } from './campaign'

export function buildUserOrganizationQuery(queryParam, organizationId, role, campaignId) {
  const roleFilter = role ? { role } : {}

  queryParam
    .from('user_organization')
    .innerJoin('user', 'user_organization.user_id', 'user.id')
    .where(roleFilter)
    .where({ 'user_organization.organization_id': organizationId })
    .distinct()

  if (campaignId) {
    queryParam.innerJoin('assignment', 'assignment.user_id', 'user.id')
    .where({ 'assignment.campaign_id': campaignId })
  }
  return queryParam
}

function buildUsersQuery(queryParam, organizationId, campaignsFilter, role) {
  let query = undefined
  if (campaignsFilter) {
    query = queryParam
      .from('assignment')
      .join('user', 'assignment.user_id', 'user.id')
      .join('user_organization', 'user.id', 'user_organization.user_id')
      .join('campaign', 'assignment.campaign_id', 'campaign.id')
      .where('user_organization.organization_id', organizationId)
      .distinct()

    if (role) {
      query = query.where('user_organization.role', role)
    }

    return addCampaignsFilterToQuery(query, campaignsFilter)
  }

  return buildUserOrganizationQuery(queryParam, organizationId, role)
}

export async function getUsers(organizationId, cursor, campaignsFilter, role) {
  let usersQuery = buildUsersQuery(r.knex.select('user.*'), organizationId, campaignsFilter, role)
  usersQuery = usersQuery.orderBy('first_name').orderBy('last_name').orderBy('id')

  if (cursor) {
    usersQuery = usersQuery.limit(cursor.limit).offset(cursor.offset)
    const users = await usersQuery

    const usersCountQuery = buildUsersQuery(r.knex.countDistinct('user.id'), organizationId, campaignsFilter, role)

    const usersCountArray = await usersCountQuery

    const pageInfo = {
      limit: cursor.limit,
      offset: cursor.offset,
      total: usersCountArray[0].count
    }

    return {
      users,
      pageInfo
    }
  } else {
    return usersQuery
  }
}

export const resolvers = {
  UsersReturn: {
    __resolveType(obj) {
      if (Array.isArray(obj)) {
        return 'UsersList'
      } else if ('users' in obj && 'pageInfo' in obj) {
        return 'PaginatedUsers'
      }
      return null
    }
  },
  UsersList: {
    users: users => users
  },
  PaginatedUsers: {
    users: queryResult => queryResult.users,
    pageInfo: queryResult => {
      if ('pageInfo' in queryResult) {
        return queryResult.pageInfo
      }
      return null
    }
  },
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
    assignment: async (user, { campaignId }) => {
      if (user.assignment_id && user.assignment_campaign_id === Number(campaignId)) {
        // from context of campaign.texters.assignment
        return { id: user.assignment_id,
                 campaign_id: user.assignment_campaign_id,
                 max_contacts: user.assignment_max_contacts }
      }
      return r.table('assignment')
        .getAll(user.id, { index: 'user_id' })
        .filter({ campaign_id: campaignId })
        .limit(1)(0)
        .default(null)
    },
    organizations: async (user, { role }) => {
      if (!user || !user.id) {
        return []
      }
      // Note: this only returns {id, name}, but that is all apis need here
      return await cacheableData.user.userOrgs(user.id, role)
    },
    roles: async(user, { organizationId }) => (
      cacheableData.user.orgRoles(user.id, organizationId)
    ),
    todos: async (user, { organizationId }) => (
      r.table('assignment')
        .getAll(user.id, { index: 'assignment.user_id' })
        .eqJoin('campaign_id', r.table('campaign'))
        .filter({ 'is_started': true,
                 'organization_id': organizationId,
                 'is_archived': false }
               )('left')
    ),
    cacheable: () => Boolean(r.redis)
  }
}
