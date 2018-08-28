import thinky from './thinky'
const type = thinky.type
import { requiredString } from './custom-types'

const ZipCode = thinky.createModel('zip_code', type.object().schema({
  zip: requiredString(),
  city: requiredString(),
  state: requiredString(),
  latitude: type
    .number()
    .required()
    .allowNull(false),
  longitude: type
    .number()
    .required()
    .allowNull(false),
  timezone_offset: type
    .number()
    .required()
    .allowNull(false),
  has_dst: type
    .boolean()
    .required()
    .allowNull(false)
}, {noAutoCreation: true}).allowExtra(false), { pk: 'zip' })

export default ZipCode
