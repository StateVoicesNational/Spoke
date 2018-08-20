// Used to generate data-test attributes on non-production environments and used by end-to-end tests
export const dataTest = (value) => {
  const attribute = window.NODE_ENV !== 'production' ? { 'data-test': value } : {}
  return attribute
}
