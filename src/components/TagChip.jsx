import React from "react";
import Chip from "@material-ui/core/Chip";
import type from "prop-types";
import Avatar from "@material-ui/core/Avatar";
import FlagIcon from "@material-ui/icons/Flag";
import theme from "../styles/theme";

const inlineStyles = {
  chip: {
    display: "inline-flex",
    height: "25px",
    justifyContent: "center",
    flexWrap: "nowrap",
    alignItems: "center",
    verticalAlign: "middle",
    marginBottom: "8px",
    color: "#111",
    marginRight: "2px"
  },
  text: {
    fontSize: "12px",
    fontWeight: "900",
    color: "#111",
    maxWidth: 200,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  icon: {
    width: "16px",
    height: "16px",
    verticalAlign: "middle",
    color: "#111",
    marginLeft: "10px"
  }
};

export const TagChip = props => (
  <Chip
    style={{
      ...inlineStyles.chip,
      backgroundColor: props.backgroundColor || theme.colors.lightYellow,
      ...(props.style ? props.style : {})
    }}
    onClick={props.onClick}
    onDelete={props.onDelete}
    label={props.text}
    onClick={props.onClick}
    avatar={
      <Avatar
        style={{
          ...inlineStyles.icon,
          backgroundColor: props.backgroundColor || theme.colors.lightYellow
        }}
      >
        {props.icon || <FlagIcon fontSize="small" />}
      </Avatar>
    }
  />
);

TagChip.propTypes = {
  text: type.string,
  icon: type.element,
  backgroundColor: type.string
};

export default TagChip;
