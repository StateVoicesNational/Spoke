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

// Create a deep copy of an object so nested properties are also mutable
export function deepCopy(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => deepCopy(item));
  } else if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, deepCopy(value)])
    );
  } else {
    return obj;
  }
}
