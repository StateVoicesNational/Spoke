import React from "react";
import type from "prop-types";

import DropDownMenu from "material-ui/DropDownMenu";
import MenuItem from "material-ui/MenuItem";
import { ROLE_HIERARCHY } from "../../lib";

export const ALL_ROLES = "ALL ROLES";

const SimpleRolesDropdown = props => (
  <DropDownMenu
    value={props.selectedRole}
    onChange={(event, index, value) => props.onChange(value)}
  >
    {[ALL_ROLES].concat(ROLE_HIERARCHY).map(option => (
      <MenuItem
        key={option}
        value={option}
        primaryText={`${option.charAt(0).toUpperCase()}${option
          .substring(1)
          .toLowerCase()}`}
      />
    ))}
  </DropDownMenu>
);

SimpleRolesDropdown.propTypes = {
  selectedRole: type.string,
  onChange: type.func
};

export default SimpleRolesDropdown;
