import React from "react";
import MenuItem from "material-ui/MenuItem";
import pick from "lodash/pick";

export function dataSourceItem(name, key) {
  return {
    text: name,
    rawValue: key,
    value: <MenuItem key={key} primaryText={name} />
  };
}

export function getRaisedButtonProps(props) {
  const validProps = [
    "backgroundColor",
    "buttonStyle",
    "children",
    "className",
    "containerElement",
    "disableTouchRipple",
    "disabled",
    "disabledBackgroundColor",
    "disabledLabelColor",
    "fullWidth",
    "href",
    "icon",
    "label",
    "labelColor",
    "labelPosition",
    "labelStyle",
    "onClick",
    "overlayStyle",
    "primary",
    "rippleStyle",
    "secondary",
    "style",
    "data-test"
  ];
  return pick(props, validProps);
}
