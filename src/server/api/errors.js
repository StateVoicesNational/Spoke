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

export async function assignmentRequired(
  user,
  assignmentId,
  assignment,
  contact
) {
  authRequired(user);

  if (user.is_superadmin) {
    return true;
  }
  // console.log(
  //   "createOptOut assignmentRequired",
  //   user.id,
  //   assignmentId,
  //   contact
  // );
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
  // console.log(
  //   "createOptOut assignmentRequired dbcall",
  //   user.id,
  //   assignmentId,
  //   contact
  // );
  const [userHasAssignment] = await r
    .knex("assignment")
    .where({
      user_id: user.id,
      id: assignmentId
    })
    .limit(1);
  // console.log(
  //   "createOptOut assignmentRequired dbcall post",
  //   user.id,
  //   assignmentId,
  //   userHasAssignment
  // );
  if (!userHasAssignment) {
    // undefined or null
    throw new GraphQLError("You are not authorized to access that resource.");
  }
  return userHasAssignment;
}

export async function assignmentRequiredOrAdminRole(
  user,
  orgId,
  assignmentId,
  contact
) {
  authRequired(user);
  // console.log(
  //   "createOptOut assignmentRequiredOrAdminRole",
  //   user.id,
  //   orgId,
  //   assignmentId
  // );
  const isAdmin = await cacheableData.user.userHasRole(user, orgId, "ADMIN");
  // console.log(
  //   "createOptOut assignmentRequiredOrAdminRole isAdmin",
  //   user.id,
  //   orgId,
  //   assignmentId,
  //   isAdmin
  // );
  if (isAdmin || user.is_superadmin) {
    return true;
  }
  // console.log(
  //   "createOptOut assignmentRequiredOrAdminRole assignmentRequiredCall",
  //   user.id,
  //   orgId
  // );
  // calling exports.assignmentRequired instead of just assignmentRequired
  // is functionally identical but it allows us to mock assignmentRequired
  return await exports.assignmentRequired(user, assignmentId, null, contact);
}

export function superAdminRequired(user) {
  authRequired(user);

  if (!user.is_superadmin) {
    throw new GraphQLError("You are not authorized to access that resource.");
  }
}
