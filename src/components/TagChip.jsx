import React from "react";
import { compose } from "recompose";
import Chip from "@material-ui/core/Chip";
import type from "prop-types";
import Avatar from "@material-ui/core/Avatar";
import FlagIcon from "@material-ui/icons/Flag";
import withMuiTheme from "../containers/hoc/withMuiTheme";

export const TagChip = props => {
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
  return (
    <Chip
      style={{
        ...inlineStyles.chip,
        backgroundColor:
          props.backgroundColor || props.muiTheme.palette.warning.main,
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
            backgroundColor:
              props.backgroundColor || props.muiTheme.palette.warning.main
          }}
        >
          {props.icon || <FlagIcon fontSize="small" />}
        </Avatar>
      }
    />
  );
};

TagChip.propTypes = {
  text: type.string,
  icon: type.element,
  backgroundColor: type.string
};

export default compose(withMuiTheme)(TagChip);
