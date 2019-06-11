import { mapFieldsToModel } from './lib/utils'
import { r, User, cacheableData } from '../models'
import { addCampaignsFilterToQuery } from './campaign'

const firstName = '"user"."first_name"'
const lastName = '"user"."last_name"'
const created = '"user"."created_at"'
const oldest = created
const newest = '"user"."created_at" desc'

function buildSelect(sortBy) {
  const userStar = '"user".*' 

  let fragmentArray = undefined

  switch (sortBy) {
    case 'COUNT_ONLY':
      return r.knex.countDistinct('user.id')
    case 'LAST_NAME':
      fragmentArray = [userStar]
      break
    case 'NEWEST':
      fragmentArray = [userStar]
      break
    case 'OLDEST':
      fragmentArray = [userStar]
      break
    case 'FIRST_NAME':
    default:
      fragmentArray = [userStar]
      break
  }

  return r.knex.select(r.knex.raw(fragmentArray.join(', ')))
}

function buildOrderBy(query, sortBy) {
  let fragmentArray = undefined

  switch (sortBy) {
    case 'COUNT_ONLY':
      return query
    case 'LAST_NAME':
      fragmentArray = [lastName, firstName, newest]
      break
    case 'NEWEST':
      fragmentArray = [newest]
      break
    case 'OLDEST':
      fragmentArray = [oldest]
      break
    case 'FIRST_NAME':
    default:
      fragmentArray = [firstName, lastName, newest]
      break
  }

  return query.orderByRaw(fragmentArray.join(', '))
}

export function buildUserOrganizationQuery(queryParam, organizationId, role, campaignId, offset) {
  const roleFilter = role ? { role } : {}

  let query = queryParam
    .from('user_organization')
    .innerJoin('user', 'user_organization.user_id', 'user.id')
    .where(roleFilter)
    .whereRaw('"user_organization"."organization_id" = ?', organizationId)
    .distinct()

  if (campaignId) {
    query = query.leftOuterJoin('assignment', 'assignment.user_id', 'user.id')
    .where({ 'assignment.campaign_id': campaignId })
  }

  return query
}

export function buildSortedUserOrganizationQuery(organizationId, role, campaignId, sortBy) {
  const query = buildUserOrganizationQuery(buildSelect(sortBy), organizationId, role, campaignId)
  return buildOrderBy(query, sortBy)
}

function buildUsersQuery(organizationId, campaignsFilter, role, sortBy) {
  return buildSortedUserOrganizationQuery(organizationId, role, campaignsFilter && campaignsFilter.campaignId, sortBy)
}

export async function getUsers(organizationId, cursor, campaignsFilter, role, sortBy) {
  let usersQuery = buildUsersQuery(organizationId, campaignsFilter, role, sortBy)

  if (cursor) {
    usersQuery = usersQuery.limit(cursor.limit).offset(cursor.offset)
    const users = await usersQuery

    const usersCountQuery = buildUsersQuery(organizationId, campaignsFilter, role, 'COUNT_ONLY')

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
    cacheable: () => false // FUTURE: Boolean(r.redis) when full assignment data is cached
  }
}
