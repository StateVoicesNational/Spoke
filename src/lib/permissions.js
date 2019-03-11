export const ROLE_HIERARCHY = ['TEXTER', 'SUPERVOLUNTEER', 'ADMIN', 'OWNER']

export const isRoleGreater = (role1, role2) => (ROLE_HIERARCHY.indexOf(role1) > ROLE_HIERARCHY.indexOf(role2))

export const hasRoleAtLeast = (hasRole, wantsRole) => (ROLE_HIERARCHY.indexOf(hasRole) >= ROLE_HIERARCHY.indexOf(wantsRole))

export const getHighestRole = (roles) => {
  return roles.sort((role1, role2) => {
    if (isRoleGreater(role1, role2)) {
      return 1
    }
    else if (isRoleGreater(role2, role1)) {
      return -1
    }
    else {
      return 0
    }
  })[roles.length - 1]
}

export const hasRole = (role, roles) => hasRoleAtLeast(getHighestRole(roles), role)
