import { getFeatures } from "./lib/config";
import { mapFieldsToModel } from "./lib/utils";
import { rolesEqualOrLess } from "../../lib/permissions";
import { r, User, cacheableData } from "../models";

const firstName = '"user"."first_name"';
const lastName = '"user"."last_name"';
const created = '"user"."created_at"';
const oldest = created;
const newest = '"user"."id" desc';

const lower = column => `lower(${column})`;

function buildSelect(sortBy) {
  const userStar = '"user".*';

  let fragmentArray = undefined;
  if (sortBy === "COUNT_ONLY") {
    return r.knex.countDistinct("user.id");
  } else if (sortBy === "NEWEST") {
    fragmentArray = [userStar];
  } else if (sortBy === "OLDEST") {
    fragmentArray = [userStar];
  } else {
    //FIRST_NAME, LAST_NAME, Default
    fragmentArray = [userStar, lower(lastName), lower(firstName)];
  }
  return r.knex.select(r.knex.raw(fragmentArray.join(", ")));
}

function buildOrderBy(query, sortBy) {
  let fragmentArray = undefined;

  if (sortBy === "COUNT_ONLY") {
    return query;
  } else if (sortBy === "NEWEST") {
    fragmentArray = [newest];
  } else if (sortBy === "OLDEST") {
    fragmentArray = [oldest];
  } else if (sortBy === "LAST_NAME") {
    fragmentArray = [lower(lastName), lower(firstName), newest];
  } else {
    // FIRST_NAME, Default
    fragmentArray = [lower(firstName), lower(lastName), newest];
  }
  return query.orderByRaw(fragmentArray.join(", "));
}

const addLeftOuterJoin = query =>
  query.leftOuterJoin("assignment", "assignment.user_id", "user.id");

export function buildUsersQuery(
  organizationId,
  role,
  sortBy,
  campaignsFilter,
  filterString,
  filterBy
) {
  const queryParam = buildSelect(sortBy);
  const roleFilter = role && role !== "ANY" ? { role } : {};
  const suspendedFilter =
    role === "SUSPENDED" || role === "ANY" ? {} : { role: "SUSPENDED" };

  let query = queryParam
    .from("user_organization")
    .innerJoin("user", "user_organization.user_id", "user.id")
    .where(roleFilter)
    .whereNot(suspendedFilter)
    .whereRaw('"user_organization"."organization_id" = ?', organizationId)
    .distinct();

  if (filterString) {
    const filterStringWithPercents = (
      "%" +
      filterString +
      "%"
    ).toLocaleLowerCase();

    if (filterBy === "FIRST_NAME") {
      query = query.andWhere(
        r.knex.raw("lower(first_name) like ?", [filterStringWithPercents])
      );
    } else if (filterBy === "LAST_NAME") {
      query = query.andWhere(
        r.knex.raw("lower(last_name) like ?", [filterStringWithPercents])
      );
    } else if (filterBy === "EMAIL") {
      query = query.andWhere(
        r.knex.raw("lower(email) like ?", [filterStringWithPercents])
      );
    } else {
      query = query.andWhere(
        r.knex.raw(
          "lower(first_name) like ? OR lower(last_name) like ? OR lower(email) like ?",
          [
            filterStringWithPercents,
            filterStringWithPercents,
            filterStringWithPercents
          ]
        )
      );
    }
  }

  if (campaignsFilter) {
    if (campaignsFilter.campaignId) {
      query = addLeftOuterJoin(query);
      query = query.where({
        "assignment.campaign_id": campaignsFilter.campaignId
      });
    } else if (
      campaignsFilter.campaignIds &&
      campaignsFilter.campaignIds.length > 0
    ) {
      const questionMarks = Array(campaignsFilter.campaignIds.length)
        .fill("?")
        .join(",");
      query = addLeftOuterJoin(query);
      query = query.whereRaw(
        `"assignment"."campaign_id" in (${questionMarks})`,
        campaignsFilter.campaignIds
      );
    }
  }
  return buildOrderBy(query, sortBy);
}

export async function getUsers(
  organizationId,
  cursor,
  campaignsFilter,
  role,
  sortBy,
  filterString,
  filterBy
) {
  let usersQuery = buildUsersQuery(
    organizationId,
    role,
    sortBy,
    campaignsFilter,
    filterString,
    filterBy
  );

  if (cursor) {
    usersQuery = usersQuery.limit(cursor.limit).offset(cursor.offset);
    const users = await usersQuery;
    const usersCountQuery = buildUsersQuery(
      organizationId,
      role,
      "COUNT_ONLY",
      campaignsFilter
    );

    const usersCount = await r.getCount(usersCountQuery);
    const pageInfo = {
      limit: cursor.limit,
      offset: cursor.offset,
      total: usersCount
    };

    return {
      users,
      pageInfo
    };
  } else {
    return usersQuery;
  }
}

export const resolvers = {
  UsersReturn: {
    __resolveType(obj) {
      if (Array.isArray(obj)) {
        return "UsersList";
      } else if ("users" in obj && "pageInfo" in obj) {
        return "PaginatedUsers";
      }
      return null;
    }
  },
  UsersList: {
    users: users => users
  },
  PaginatedUsers: {
    users: queryResult => queryResult.users,
    pageInfo: queryResult => {
      if ("pageInfo" in queryResult) {
        return queryResult.pageInfo;
      }
      return null;
    }
  },
  User: {
    ...mapFieldsToModel(
      [
        "id",
        "firstName",
        "lastName",
        "alias",
        "email",
        "cell",
        "assignedCell",
        "terms"
      ],
      User
    ),
    extra: user =>
      user.extra && typeof user.extra === "object"
        ? JSON.stringify(user.extra)
        : user.extra || null,
    displayName: user =>
      `${user.first_name}${user.alias ? ` (${user.alias}) ` : " "}${
        user.last_name
      }`,
    assignment: async (user, { campaignId }) => {
      if (
        user.assignment_id &&
        user.assignment_campaign_id === Number(campaignId)
      ) {
        // from context of campaign.texters.assignment
        return {
          id: user.assignment_id,
          campaign_id: user.assignment_campaign_id,
          max_contacts: user.assignment_max_contacts
        };
      }
      return r
        .table("assignment")
        .getAll(user.id, { index: "user_id" })
        .filter({ campaign_id: campaignId })
        .limit(1)(0)
        .default(null);
    },
    organizations: async (user, { role }) => {
      if (!user || !user.id) {
        return [];
      }
      // Note: this only returns {id, name}, but that is all apis need here
      return await cacheableData.user.userOrgs(user.id, role);
    },
    roles: async (user, { organizationId }) => {
      return user.role
        ? rolesEqualOrLess(user.role)
        : await cacheableData.user.orgRoles(user.id, organizationId);
    },
    todos: async (user, { organizationId }) =>
      r
        .table("assignment")
        .getAll(user.id, { index: "assignment.user_id" })
        .eqJoin("campaign_id", r.table("campaign"))
        .filter({
          is_started: true,
          organization_id: organizationId,
          is_archived: false
        })("left"),
    profileComplete: async (user, { organizationId }) => {
      const org = await cacheableData.organization.load(organizationId);
      // @todo: standardize on escaped or not once there's an interface.
      const profileFields = getFeatures(org).profile_fields;
      const fields =
        typeof profileFields === "string"
          ? JSON.parse(profileFields)
          : getFeatures(org).profile_fields || [];
      for (const field of fields) {
        if (!user.extra || !user.extra[field.name]) {
          return false;
        }
      }
      return true;
    },
    cacheable: () => false // FUTURE: Boolean(r.redis) when full assignment data is cached
  }
};
