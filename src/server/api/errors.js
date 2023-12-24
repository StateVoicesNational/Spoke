import { GraphQLError } from "graphql/error";
import { r, cacheableData } from "../models";

export function authRequired(user) {
  if (!user) {
    throw new GraphQLError("You must login to access that resource.", {
      extensions: {
        status: 401
      }
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
    const error = new GraphQLError(
      "You are not authorized to access that resource."
    );
    error.code = "UNAUTHORIZED";
    throw error;
  }
}

export async function assignmentRequiredOrAdminRole(
  user,
  orgId,
  assignmentId,
  contact,
  assignment
) {
  authRequired(user);

  if (user.is_superadmin) {
    return true;
  }
  if (assignment && assignment.user_id === user.id) {
    // if we are passed the full assignment object, we can test directly
    return true;
  }
  if (
    contact &&
    contact.user_id === user.id &&
    contact.assignment_id === Number(assignmentId)
  ) {
    // cached contact data can have assignment_id and user_id
    // check both to verify that the assignmentId-userId pair are accepted
    return true;
  }

  const userHasAssignment = await cacheableData.assignment.hasAssignment(
    user.id,
    assignmentId
  );

  const roleRequired = userHasAssignment ? "TEXTER" : "SUPERVOLUNTEER";
  const hasPermission = await cacheableData.user.userHasRole(
    user,
    orgId,
    roleRequired
  );
  if (!hasPermission) {
    const error = new GraphQLError(
      "You are not authorized to access that resource."
    );
    error.code = "UNAUTHORIZED";
    throw error;
  }
  return userHasAssignment || true;
}
