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
    height: "18px",
    justifyContent: "center",
    flexWrap: "nowrap",
    alignItems: "center",
    backgroundColor: theme.colors.lightYellow
  },
  text: {
    fontSize: "10px",
    fontWeight: "900",
    color: gray900
  },
  icon: {
    width: "16px",
    height: "16px",
    backgroundColor: theme.colors.lightYellow
  }
};

export const TagChip = props => (
  <Chip style={inlineStyles.chip}>
    <Avatar style={inlineStyles.icon}>
      <FlagIcon />
    </Avatar>
    <div style={inlineStyles.text}>{props.text}</div>
  </Chip>
);

TagChip.propTypes = {
  text: type.string
};

export default TagChip;
