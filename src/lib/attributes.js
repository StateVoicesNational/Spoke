// Used to generate data-test attributes on non-production environments and used by end-to-end tests
export const dataTest = (value, disable) => {
  const attribute = (process.env.NODE_ENV !== 'production' && !disable) ? { 'data-test': value } : {}
  return attribute
}
