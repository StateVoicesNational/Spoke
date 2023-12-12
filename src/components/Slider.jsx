import type from "prop-types";
import React from "react";
import {flowRight as compose} from 'lodash';
import withMuiTheme from "./../containers/hoc/withMuiTheme";

const Slider = ({ maxValue, value, color, direction, muiTheme }) => {
  const valuePercent = Math.round((value / maxValue) * 100);
  return (
    <div
      style={{
        height: 25,
        width: "100%",
        outline: `1px solid ${muiTheme.palette.text.disabled}`,
        textAlign: `${direction === 0 ? "left" : "right"}`
      }}
    >
      <div
        style={{
          width: `${valuePercent}%`,
          backgroundColor: color,
          height: 25,
          display: "inline-block",
          marginLeft: "auto"
        }}
      ></div>
    </div>
  );
};

Slider.propTypes = {
  color: type.string,
  maxValue: type.number,
  value: type.number,
  direction: type.number
};

export default compose(withMuiTheme)(Slider);
