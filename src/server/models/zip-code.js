import thinky from './thinky'
const type = thinky.type
import { requiredString } from './custom-types'

const ZipCode = thinky.createModel('zip_code', type.object().schema({
  zip: requiredString(),
  city: requiredString(),
  state: requiredString(),
  location: type
    .point()
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
}).allowExtra(false), { pk: 'zip' })

ZipCode.ensureIndex('offset_dst', (doc) => [doc('timezone_offset'), doc('has_dst')])

export default ZipCode
