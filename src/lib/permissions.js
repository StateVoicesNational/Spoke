export const ROLE_HIERARCHY = [
  "SUSPENDED",
  "TEXTER",
  "VETTED_TEXTER",
  "SUPERVOLUNTEER",
  "ADMIN",
  "OWNER"
];

export const isRoleGreater = (role1, role2) =>
  ROLE_HIERARCHY.indexOf(role1) > ROLE_HIERARCHY.indexOf(role2);

export const hasRoleAtLeast = (hasRole, wantsRole) =>
  ROLE_HIERARCHY.indexOf(hasRole) >= ROLE_HIERARCHY.indexOf(wantsRole);

export const getHighestRole = roles =>
  roles.sort(isRoleGreater)[roles.length - 1];

export const hasRole = (role, roles) =>
  hasRoleAtLeast(getHighestRole(roles), role);

export const rolesEqualOrGreater = role =>
  ROLE_HIERARCHY.slice(ROLE_HIERARCHY.indexOf(role));

export const rolesEqualOrLess = role =>
  ROLE_HIERARCHY.slice(0, ROLE_HIERARCHY.indexOf(role) + 1);
