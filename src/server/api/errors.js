import { GraphQLError } from "graphql/error";
import { r, cacheableData } from "../models";

export function authRequired(user) {
  if (!user) {
    throw new GraphQLError({
      status: 401,
      message: "You must login to access that resource."
    });
  }
}

export async function accessRequired(
  user,
  orgId,
  role,
  allowSuperadmin = false
) {
  authRequired(user);
  if (!orgId) {
    throw new Error("orgId not passed correctly to accessRequired");
  }
  if (allowSuperadmin && user.is_superadmin) {
    return;
  }
  // require a permission at-or-higher than the permission requested
  const hasRole = await cacheableData.user.userHasRole(user, orgId, role);
  if (!hasRole) {
    throw new GraphQLError("You are not authorized to access that resource.");
  }
}

export async function assignmentRequired(user, assignmentId, assignment) {
  authRequired(user);
  console.log("assignmentRequired", user, assignmentId);
  if (user.is_superadmin) {
    return true;
  }
  if (assignment && assignment.user_id === user.id) {
    // if we are passed the full assignment object, we can test directly
    return true;
  }

  const [userHasAssignment] = await r
    .knex("assignment")
    .where({
      user_id: user.id,
      id: assignmentId
    })
    .limit(1);

  console.log(
    "assignmentRequired result",
    user,
    assignmentId,
    userHasAssignment
  );
  if (!userHasAssignment) {
    // undefined or null
    throw new GraphQLError("You are not authorized to access that resource.");
  }
  return userHasAssignment;
}

export async function assignmentOrAdminRoleRequired(
  user,
  orgId,
  assignmentId,
  assignment
) {
  authRequired(user);
  console.log("assignmentOrAdminRoleRequired", user, orgId, assignmentId);
  try {
    const isAdmin = await cacheableData.user.userHasRole(user, orgId, "ADMIN");
    if (isAdmin || user.is_superadmin) {
      return true;
    }
  } catch (err) {
    console.error("assignmentOrAdminRoleRequired Error", err);
  }
  // calling exports.assignmentRequired instead of just assignmentRequired
  // is functionally identical but it allows us to mock assignmentRequired
  return await exports.assignmentRequired(user, assignmentId, assignment);
}

export function superAdminRequired(user) {
  authRequired(user);

  if (!user.is_superadmin) {
    throw new GraphQLError("You are not authorized to access that resource.");
  }
}
