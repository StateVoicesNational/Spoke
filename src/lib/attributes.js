// Used to generate data-test attributes on non-production environments and used by end-to-end tests
export const dataTest = (value, disable) => {
  return !disable ? { "data-test": value } : {};
};

export const camelCase = str => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => {
      return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
    })
    .replace(/\s+/g, "");
};
