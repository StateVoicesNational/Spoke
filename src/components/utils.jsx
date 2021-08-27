import pick from "lodash/pick";

export function dataSourceItem(name, key) {
  return {
    text: name,
    rawValue: key
  };
}

export function getButtonProps(props) {
  const validProps = [
    "children",
    "classes",
    "color",
    "component",
    "disabled",
    "disableElevation",
    "disableFocusRipple",
    "disableRipple",
    "endIcon",
    "fullWidth",
    "href",
    "size",
    "startIcon",
    "variant",
    "data-test"
  ];
  return pick(props, validProps);
}
