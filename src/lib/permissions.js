const ROLE_LEVELS = {
  OWNER: 3,
  ADMIN: 2,
  TEXTER: 1
}

export const isRoleGreater = (role1, role2) => ROLE_LEVELS[role1] > ROLE_LEVELS[role2]

export const getHighestRole = (roles) => roles.slice().sort(isRoleGreater)[roles.length - 1]
