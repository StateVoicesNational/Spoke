// Used to generate data-test attributes on non-production environments and used by end-to-end tests
import camelCase from 'camelcase'

export const dataTest = (value, disable) => {
  const formattedValue = camelCase(value)
  const attribute = (window.NODE_ENV !== 'production' && !disable) ? { 'data-test': formattedValue } : {}
  return attribute
}
