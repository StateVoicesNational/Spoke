import { CampaignContacts } from './campaign_contacts.js'
import { uniqBy } from 'lodash'

export const parseCSV  = (file, callback) => {
  Papa.parse(file, {
    header: true,
    complete: ({data, meta, errors}, file) => {
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
        const error = `Missing fields: ${missingFields.join(',')}`
        callback({ error })
      }
      else {
        // DEDUPE
        const validationStats = {}
        const count = data.length
        let validatedData = uniqBy(data, (row) => row.cell )
        validationStats.dupeCount = count - validatedData.length

        validatedData = _.filter(validatedData, (row) => !!row.cell)
        validationStats.missingCellCount = validationStats.dupeCount - validatedData.length

        console.log("validated data", validatedData)
        const customFields = fields.filter((field) => CampaignContacts.requiredUploadFields.indexOf(field) === -1)
        callback({
          customFields,
          validationStats,
          contacts: validatedData,
        })
      }
    }
  })
}

export const convertRowToContact = (row) => {
  const customFields = row
  const contact = {}
  for (let requiredField of CampaignContacts.requiredUploadFields) {
    contact[requiredField] = row[requiredField]
    // delete customFields[requiredField]
  }

  contact.customFields = customFields
  return contact
}
