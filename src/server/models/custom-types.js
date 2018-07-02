import thinky from './thinky'
const type = thinky.type
const r = thinky.r

// In order to not end up with optional
// strings that are half null and half
// empty strings, we standardize on empty
// strings for optional strings and don't
// allow null strings

export function requiredString() {
  return type
    .string()
    .required()
    .allowNull(false)
    .min(1)
}

export function optionalString() {
  return type
    .string()
    .required()
    .allowNull(false)
    .default('')
}

export function timestamp() {
  return type
    .date()
    .required()
    .allowNull(false)
    .default(r.now())
}
