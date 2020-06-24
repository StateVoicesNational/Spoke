import React from "react";
import Chip from "material-ui/Chip";
import type from "prop-types";
import Avatar from "material-ui/Avatar";
import FlagIcon from "material-ui/svg-icons/content/flag";
import theme from "../styles/theme";
import { gray900 } from "material-ui/styles/colors";

const inlineStyles = {
  chip: {
    display: "inline-flex",
    height: "25px",
    justifyContent: "center",
    flexWrap: "nowrap",
    alignItems: "center",
    verticalAlign: "middle",
    marginBottom: "8px",
    marginRight: "2px"
  },
  text: {
    fontSize: "12px",
    fontWeight: "900",
    color: gray900
  },
  icon: {
    width: "16px",
    height: "16px",
    verticalAlign: "middle",
    marginLeft: "10px"
  }
};

export const TagChip = props => (
  <Chip
    style={{
      ...inlineStyles.chip,
      backgroundColor: props.backgroundColor || theme.colors.lightYellow
    }}
    {...props}
  >
    <Avatar
      style={{
        ...inlineStyles.icon,
        backgroundColor: props.backgroundColor || theme.colors.lightYellow
      }}
    >
      {props.icon || <FlagIcon />}
    </Avatar>
    <div style={inlineStyles.text}>{props.text}</div>
  </Chip>
);

TagChip.propTypes = {
  text: type.string,
  icon: type.element,
  backgroundColor: type.string
};

export default TagChip;
