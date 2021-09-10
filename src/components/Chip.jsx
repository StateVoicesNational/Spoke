import PropTypes from "prop-types";
import React from "react";
import _ from "lodash";

// Credit to materialize CSS
// Material UI coming out with Chip
const styles = {
  chip: {
    display: "inline-block",
    height: "32px",
    fontSize: "13px",
    fontWeight: "500",
    color: "rgba(0,0,0,0.6)",
    lineHeight: "32px",
    padding: "0 12px",
    borderRadius: "16px",
    backgroundColor: "#e4e4e4",
    margin: 5
  },
  icon: {
    cursor: "pointer",
    float: "right",
    fontSize: "16px",
    lineHeight: "32px",
    height: "30px",
    width: "16px",
    paddingLeft: "8px",
    color: "rgba(0,0,0,0.6)"
  }
};

function Chip({
  text,
  iconRightClass,
  onIconRightTouchTap,
  onClick,
  style = {}
}) {
  return (
    <div style={_.extend({}, styles.chip, style)} onClick={onClick}>
      {text}
      {iconRightClass
        ? React.createElement(iconRightClass, {
            style: styles.icon,
            onClick: onIconRightTouchTap
          })
        : ""}
    </div>
  );
}

Chip.propTypes = {
  text: PropTypes.string,
  iconRightClass: PropTypes.string,
  onIconRightTouchTap: PropTypes.func,
  onClick: PropTypes.func,
  style: PropTypes.object
};

export default Chip;
