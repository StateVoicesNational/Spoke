import React from "react";
import type from "prop-types";

import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

import { getHighestRole, ROLE_HIERARCHY } from "../../lib";

const RolesDropdown = props => (
  <Select
    value={getHighestRole(props.roles)}
    disabled={
      props.texterId === props.currentUser.id ||
      (getHighestRole(props.roles) === "OWNER" &&
        getHighestRole(props.currentUser.roles) !== "OWNER")
    }
    onChange={event => {
      return props.onChange(props.texterId, event.target.value);
    }}
  >
    {ROLE_HIERARCHY.map(option => (
      <MenuItem
        key={props.texterId + "_" + option}
        value={option}
        disabled={
          option === "OWNER" &&
          getHighestRole(props.currentUser.roles) !== "OWNER"
        }
      >
        {option.charAt(0).toUpperCase()}
        {option
          .substring(1)
          .replace("_", " ")
          .toLowerCase()}
      </MenuItem>
    ))}
  </Select>
);

RolesDropdown.propTypes = {
  roles: type.array,
  texterId: type.string,
  currentUser: type.object,
  onChange: type.func
};

export default RolesDropdown;
