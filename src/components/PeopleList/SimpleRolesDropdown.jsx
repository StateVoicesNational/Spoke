import React from "react";
import type from "prop-types";

import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

import { ROLE_HIERARCHY } from "../../lib";

export const ALL_ROLES = "ALL ROLES";

const SimpleRolesDropdown = props => (
  <Select
    value={props.selectedRole}
    onChange={(event, index, value) => props.onChange(value)}
  >
    {[ALL_ROLES].concat(ROLE_HIERARCHY).map(option => (
      <MenuItem key={option} value={option}>
        {option.charAt(0).toUpperCase()}
        {option
          .substring(1)
          .replace("_", " ")
          .toLowerCase()}
      </MenuItem>
    ))}
  </Select>
);

SimpleRolesDropdown.propTypes = {
  selectedRole: type.string,
  onChange: type.func
};

export default SimpleRolesDropdown;
