import DataLoader from "dataloader";
import { r } from "../../models";
import * as perms from "../../../lib/permissions";

/*
KEY: texterauth-${authId}
- id: type.string(),
- auth0_id: requiredString().stopReference(),
- first_name: requiredString(),
- last_name: requiredString(),
- cell: requiredString(),
- email: requiredString(),
- created_at: timestamp(),
- assigned_cell: type.string(),
- is_superadmin: type.boolean(),
- terms: type.boolean().default(false)

HASH texterroles-<userId>
key = orgId
value = highest_role:org_name

QUERYS:
userHasRole(userId, orgId, acceptableRoles) -> boolean
userLoggedIn(authId) -> user object
currentEditors(campaign, user) -> string
userOrgsWithRole(role, user.id) -> organization list
*/

const userRoleKey = userId =>
  `${process.env.CACHE_PREFIX || ""}texterroles-${userId}`;
const userAuthKey = authId =>
  `${process.env.CACHE_PREFIX || ""}texterauth-${authId}`;

const getHighestRolesPerOrg = userOrgs => {
  const highestRolesPerOrg = {};
  userOrgs.forEach(userOrg => {
    const orgId = userOrg.organization_id;
    const orgRole = userOrg.role;
    const orgName = userOrg.name;

    if (highestRolesPerOrg[orgId]) {
      if (perms.isRoleGreater(orgRole, highestRolesPerOrg[orgId].role)) {
        highestRolesPerOrg[orgId].role = orgRole;
      }
    } else {
      highestRolesPerOrg[orgId] = { id: orgId, role: orgRole, name: orgName };
    }
  });
  return highestRolesPerOrg;
};

const dbLoadUserRoles = async userId => {
  const userOrgs = await r
    .knex("user_organization")
    .where("user_id", userId)
    .join(
      "organization",
      "user_organization.organization_id",
      "organization.id"
    )
    .select(
      "user_organization.role",
      "user_organization.organization_id",
      "organization.name"
    );

  const highestRolesPerOrg = getHighestRolesPerOrg(userOrgs);
  if (r.redis) {
    // delete keys first
    // pass all values to hset instead of looping
    const key = userRoleKey(userId);
    const mappedHighestRoles = Object.values(highestRolesPerOrg).reduce(
      (acc, orgRole) => {
        acc.push(orgRole.id, `${orgRole.role}:${orgRole.name}`);
        return acc;
      },
      []
    );
    if (mappedHighestRoles.length) {
      await r.redis
        .multi()
        .del(key)
        .hmset(key, ...mappedHighestRoles)
        .execAsync();
    } else {
      await r.redis.delAsync(key);
    }
  }

  return highestRolesPerOrg;
};

const loadUserRoles = async userId => {
  if (r.redis) {
    const roles = await r.redis.hgetallAsync(userRoleKey(userId));
    if (roles) {
      const userRoles = {};
      Object.keys(roles).forEach(orgId => {
        const [highestRole, orgName] = roles[orgId].split(":");
        userRoles[orgId] = { id: orgId, name: orgName, role: highestRole };
      });
      return userRoles;
    }
  }
  return await dbLoadUserRoles(userId);
};

const dbLoadUserAuth = async (field, val) => {
  const userAuth = await r
    .knex("user")
    .where(field, val)
    .select("*")
    .first();
  if (userAuth && typeof userAuth.extra === "string") {
    userAuth.extra = JSON.parse(userAuth.extra);
  }
  if (r.redis && userAuth) {
    const authKey = userAuthKey(val);
    await r.redis
      .multi()
      .set(authKey, JSON.stringify(userAuth))
      .expire(authKey, 43200)
      .execAsync();
    await dbLoadUserRoles(userAuth.id);
  }
  return userAuth;
};

const userOrgs = async (userId, role) => {
  const acceptableRoles = role
    ? perms.rolesEqualOrGreater(role)
    : [...perms.ROLE_HIERARCHY];
  const orgRoles = await loadUserRoles(userId);
  const matchedOrgs = Object.keys(orgRoles).filter(
    orgId => acceptableRoles.indexOf(orgRoles[orgId].role) !== -1
  );
  return matchedOrgs.map(orgId => orgRoles[orgId]);
};

const orgRoles = async (userId, orgId) => {
  const orgRolesDict = await loadUserRoles(userId);
  if (orgId in orgRolesDict) {
    return perms.rolesEqualOrLess(orgRolesDict[orgId].role);
  }
  return [];
};

const userOrgHighestRole = async (userId, orgId) => {
  let highestRole = "";
  if (r.redis) {
    // cached approach
    const userKey = userRoleKey(userId);
    const cacheRoleResult = await r.redis.hgetAsync(userKey, orgId);
    if (cacheRoleResult) {
      highestRole = cacheRoleResult.split(":")[0];
    } else {
      // need to get it from db, and then cache it
      const highestRoles = await dbLoadUserRoles(userId);
      highestRole = highestRoles[orgId] && highestRoles[orgId].role;
    }
  }
  if (!highestRole) {
    // regular DB approach
    const roles = await r
      .knex("user_organization")
      .select("role")
      .where({ user_id: userId, organization_id: orgId });
    if (roles.length) {
      highestRole = perms.getHighestRole(roles.map(ri => ri.role));
    }
  }
  return highestRole;
};

const userHasRole = async (user, orgId, role) => {
  const acceptableRoles = perms.rolesEqualOrGreater(role);
  let highestRole = "";
  if (user.orgRoleCache) {
    highestRole = await user.orgRoleCache.load(`${user.id}:${orgId}`);
  } else {
    highestRole = await userOrgHighestRole(user.id, orgId);
  }
  return Boolean(highestRole && acceptableRoles.indexOf(highestRole) >= 0);
};

const userLoggedIn = async (field, val) => {
  if (field !== "id" && field !== "auth0_id") {
    return null;
  }
  const authKey = userAuthKey(val);
  let user = null;

  if (r.redis) {
    const cachedAuth = await r.redis.getAsync(authKey);
    if (cachedAuth) {
      user = JSON.parse(cachedAuth);
    }
  }
  if (!user) {
    user = await dbLoadUserAuth(field, val);
  }
  if (user) {
    // This will be per-request, and can cache through multiple tests
    user.orgRoleCache = new DataLoader(async keys =>
      keys.map(async key => {
        const [userId, orgId] = key.split(":");
        return await userOrgHighestRole(userId, orgId);
      })
    );
  }
  return user;
};

const userCache = {
  userHasRole,
  userLoggedIn,
  userOrgs,
  orgRoles,
  clearUser: async (userId, authId) => {
    if (r.redis) {
      await r.redis.delAsync(userRoleKey(userId));
      await r.redis.delAsync(userAuthKey(userId));
      if (authId) {
        await r.redis.delAsync(userAuthKey(authId));
      }
    }
  }
};

export default userCache;
