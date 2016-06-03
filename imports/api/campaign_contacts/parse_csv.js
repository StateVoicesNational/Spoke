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
        let validatedData = []
        // DEDUPE
        const validationStats = {}
        const count = data.length

        const badCells = []

        const { NumberParseException, PhoneNumberUtil, PhoneNumberFormat } = require('google-libphonenumber')

        const phoneUtil = PhoneNumberUtil.getInstance()

        _.each(data, (contact) => {
          try {
            const inputNumber = phoneUtil.parse(contact.cell, "US")
            const isValid = phoneUtil.isValidNumber(inputNumber)
            if (isValid) {
              const formattedCell = phoneUtil.format(inputNumber, PhoneNumberFormat.E164)
              validatedData.push(_.extend(contact, { cell: formattedCell, unformattedCell: contact.cell }))
            }
            else {
              console.log("not valid", contact.cell)
              badCells.push(contact)
            }
          } catch (e) {
            console.log(e)
            badCells.push(contact)
          }
        })

        validationStats.invalidCellCount = badCells.length
        // validatedData = uniqBy(validatedData, (row) => row.cell )

        // validationStats.dupeCount = count - validatedData.length

        validatedData = _.filter(validatedData, (row) => !!row.cell)
        validationStats.missingCellCount = count - validationStats.dupeCount - validatedData.length

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
