import { CampaignContacts } from './campaign_contacts.js'
import { OptOuts } from '../opt_outs/opt_outs.js'
import { uniqBy } from 'lodash'
import { getFormattedPhoneNumber } from '../../../both/phone_format'

const getValidatedData = (data) => {
  let validatedData
  let result
  // For some reason destructuring is not working here
  result = _.partition(data, (row) => !!row.cell)
  validatedData = result[0]
  const missingCellRows = result[1]

  validatedData = _.map(validatedData, (row) => _.extend(row, {
    cell: getFormattedPhoneNumber(row.cell),
    unformattedCell: row.cell }))
  result = _.partition(validatedData, (row) => !!row.cell)
  validatedData = result[0]
  const invalidCellRows = result[1]

  const count = validatedData.length
  validatedData = uniqBy(validatedData, (row) => row.cell)
  const dupeCount = (count - validatedData.length)

  // TODO: organizationID
  result = _.partition(validatedData, (row) => !OptOuts.findOne({ cell: row.cell }))
  validatedData = result[0]
  const optOutRows = result[1]

  return {
    validatedData,
    validationStats: {
      dupeCount,
      optOutCount: optOutRows.length,
      invalidCellCount: invalidCellRows.length,
      missingCellCount: missingCellRows.length
    }
  }
}

export const parseCSV = (file, callback) => {
  Papa.parse(file, {
    header: true,
    complete: ({ data, meta, errors }, file) => {
      // TODO: Validate fields
      // Papaparse errors are very permissiive so we cerate
      // our own error
      const fields = meta.fields

      const missingFields = []

      for (let field of CampaignContacts.requiredUploadFields) {
        if (fields.indexOf(field) === -1) {
          missingFields.push(field)
        }
      }

      if (missingFields.length > 0) {
        // TODO better to throw error?
        const error = `Missing fields: ${missingFields.join(', ')}`
        callback({ error })
      }
      else {
        const { validationStats, validatedData } = getValidatedData(data)

        const customFields = fields.filter((field) => CampaignContacts.topLevelUploadFields.indexOf(field) === -1)

        callback({
          customFields,
          validationStats,
          contacts: validatedData
        })
      }
    }
  })
}

export const convertRowToContact = (row) => {
  const customFields = row
  const contact = {}
  for (let field of CampaignContacts.topLevelUploadFields) {
    if (_.has(row, field)) {
      contact[field] = row[field]
    }
    // contact[requiredField] = row[requiredField]
    // delete customFields[requiredField]
  }

  contact.customFields = customFields
  return contact
}
