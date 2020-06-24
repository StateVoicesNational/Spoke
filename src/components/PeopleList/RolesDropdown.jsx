import React from "react";
import type from "prop-types";

import DropDownMenu from "material-ui/DropDownMenu";
import MenuItem from "material-ui/MenuItem";
import { getHighestRole, ROLE_HIERARCHY } from "../../lib";

const RolesDropdown = props => (
  <DropDownMenu
    value={getHighestRole(props.roles)}
    disabled={
      props.texterId === props.currentUser.id ||
      (getHighestRole(props.roles) === "OWNER" &&
        getHighestRole(props.currentUser.roles) !== "OWNER")
    }
    onChange={(event, index, value) => props.onChange(props.texterId, value)}
  >
    {ROLE_HIERARCHY.map(option => (
      <MenuItem
        key={props.texterId + "_" + option}
        value={option}
        disabled={
          option === "OWNER" &&
          getHighestRole(props.currentUser.roles) !== "OWNER"
        }
        primaryText={`${option.charAt(0).toUpperCase()}${option
          .substring(1)
          .toLowerCase()}`}
      />
    ))}
  </DropDownMenu>
);

RolesDropdown.propTypes = {
  roles: type.array,
  texterId: type.string,
  currentUser: type.object,
  onChange: type.func
};

export default RolesDropdown;
