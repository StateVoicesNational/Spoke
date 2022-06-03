import { getConfig, getFeatures } from "./lib/config";
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
    // FIRST_NAME, LAST_NAME, Default
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

  let query = queryParam
    .from("user_organization")
    .innerJoin("user", "user_organization.user_id", "user.id")
    .where("organization_id", organizationId)
    .distinct();

  if (role !== "ANY") {
    if (role) {
      query = query.where({ role: role });
    }
    if (role !== "SUSPENDED") {
      query = query.whereNot({ role: "SUSPENDED" });
    }
  }

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
          "(lower(first_name) like ? OR lower(last_name) like ? OR lower(email) like ?)",
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

export const getUserTodos = async (
  user,
  { organizationId, withOutCounts },
  { user: loggedInUser, queryFilter }
) => {
  const fields = [
    "assignment.id",
    "assignment.campaign_id",
    "assignment.user_id",
    "assignment.max_contacts",
    "assignment.created_at",
    "assignment_feedback.feedback",
    "assignment_feedback.is_acknowledged",
    "assignment_feedback.creator_id",
    "campaign.use_dynamic_assignment"
  ];
  let query = r
    .knexReadOnly("assignment")
    .join("campaign", "assignment.campaign_id", "campaign.id")
    .leftJoin(
      "assignment_feedback",
      "assignment.id",
      "assignment_feedback.assignment_id"
    )
    .andWhere({
      is_started: true
    })
    .andWhere("assignment.user_id", user.id);

  if (/texter-feedback/.test(getConfig("TEXTER_SIDEBOXES"))) {
    query = query.whereRaw(
      `(
          is_archived = false
          OR (assignment_feedback.is_acknowledged = true
              AND assignment_feedback.complete = true)
          )`
    );
  } else {
    query.andWhere("is_archived", false);
  }

  if (organizationId) {
    query.where("organization_id", organizationId);
  }

  if (getConfig("FILTER_DUEBY", null, { truthy: 1 })) {
    query = query.where("campaign.due_by", ">", new Date());
  }

  if (queryFilter) {
    query = queryFilter(query);
  }

  if (withOutCounts) {
    return await query.select(fields);
  } else {
    query
      .leftOuterJoin("campaign_contact", function() {
        this.on("campaign_contact.assignment_id", "assignment.id").andOn(
          "campaign_contact.is_opted_out",
          r.knex.raw("?", [false])
        );
        // https://github.com/knex/knex/issues/1003#issuecomment-287302118
      })
      .groupBy(
        ...fields,
        "campaign_contact.timezone_offset",
        "campaign_contact.message_status"
      )
      .select(
        ...fields,
        "campaign_contact.timezone_offset",
        "campaign_contact.message_status",
        r.knexReadOnly.raw(
          "SUM(CASE WHEN campaign_contact.id IS NOT NULL THEN 1 ELSE 0 END) as tz_status_count"
        )
      );
    const result = await query;
    const campaignIds = result
      .filter(a => a.use_dynamic_assignment)
      .map(a => a.campaign_id);
    const campaignsWithUnassigned = {};
    let hasUnassigned = [];
    if (campaignIds.length) {
      hasUnassigned = await r
        .knex("campaign_contact")
        .where({
          is_opted_out: false,
          message_status: "needsMessage"
        })
        .whereNull("assignment_id")
        .whereIn("campaign_id", campaignIds)
        .select("campaign_id")
        .groupBy("campaign_id")
        .havingRaw("count(1) > 0");
      hasUnassigned.forEach(c => {
        campaignsWithUnassigned[c.campaign_id] = 1;
      });
    }
    const assignments = {};
    for (const assn of result) {
      if (!assignments[assn.id]) {
        assignments[assn.id] = {
          ...assn,
          tzStatusCounts: {}
        };
        if (assn.use_dynamic_assignment && campaignIds.length) {
          assignments[assn.id].hasUnassigned =
            campaignsWithUnassigned[assn.campaign_id] || 0;
        }
      }
      if (!assignments[assn.id].tzStatusCounts[assn.message_status]) {
        assignments[assn.id].tzStatusCounts[assn.message_status] = [];
      }
      assignments[assn.id].tzStatusCounts[assn.message_status].push({
        tz: assn.timezone_offset,
        count: assn.tz_status_count
      });
    }
    return Object.values(assignments);
  }
};

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
    todos: async (
      user,
      { organizationId, withOutCounts },
      { user: loggedInUser }
    ) => {
      const assignments = await getUserTodos(
        user,
        { organizationId, withOutCounts },
        { user: loggedInUser }
      );
      if (user.id === loggedInUser.id) {
        // clears notifications
        await cacheableData.user.getAndClearNotifications(user.id);
      }
      return assignments;
    },
    profileComplete: async (user, { organizationId }, { loaders }) => {
      const org = await loaders.organization.load(organizationId);
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
    notifications: async (user, { organizationId }, { user: loggedInUser }) => {
      if (user.id === loggedInUser.id) {
        // if e.g. an ADMIN can run this for a user, then the admin will 'consume' the notifications
        // so we block this for the admin
        const updatedAssignmentIds = await cacheableData.user.getAndClearNotifications(
          user.id
        );
        if (updatedAssignmentIds.length) {
          return getUserTodos(
            user,
            { organizationId },
            {
              user: loggedInUser,
              queryFilter: q => q.whereIn("assignment.id", updatedAssignmentIds)
            }
          );
        }
      }
      return [];
    },
    // notifiable: we need Redis to store the notifications
    //  and Postgres to support returning() in cacheableData.campaignContact.updateStatus
    notifiable: () => Boolean(r.redis) && r.knex.client.config.client === "pg"
  }
};
