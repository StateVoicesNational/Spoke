import React from "react";
import type from "prop-types";

import DropDownMenu from "material-ui/DropDownMenu";
import MenuItem from "material-ui/MenuItem";
import { getHighestRole, rolesEqualOrLess } from "../../lib";

const RolesDropdown = ({
  roles,
  currentUser,
  texterId,
  onChange,
  highestMenuRole,
  ...props
}) => (
  <DropDownMenu
    {...props}
    value={getHighestRole(roles)}
    disabled={
      texterId === currentUser.id ||
      (getHighestRole(roles) === "OWNER" &&
        getHighestRole(currentUser.roles) !== "OWNER")
    }
    onChange={(event, index, value) => onChange(texterId, value)}
  >
    {rolesEqualOrLess(highestMenuRole).map(option => (
      <MenuItem
        key={`${texterId}_${option}`}
        value={option}
        disabled={
          option === "OWNER" && getHighestRole(currentUser.roles) !== "OWNER"
        }
        primaryText={`${option.charAt(0).toUpperCase()}${option
          .substring(1)
          .replace("_", " ")
          .toLowerCase()}`}
      />
    ))}
  </DropDownMenu>
);

RolesDropdown.propTypes = {
  roles: type.array,
  texterId: type.string,
  currentUser: type.object,
  onChange: type.func,
  highestMenuRole: type.string
};

RolesDropdown.defaultProps = {
  highestMenuRole: "OWNER"
};

export default RolesDropdown;
