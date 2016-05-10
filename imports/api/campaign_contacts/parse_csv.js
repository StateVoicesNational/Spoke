import { CampaignContacts } from './campaign_contacts.js'

export const parseCSV  = (file, callback) => {
  Papa.parse(file, {
    header: true,
    complete: ({data, meta}, file) => {
      // TODO: Validate fields
      const fields = meta.fields

      const customFields = fields.filter((field) => CampaignContacts.requiredUploadFields.indexOf(field) === -1)
      callback({
        customFields,
        contacts: data
      })
    }
  })
}

export const convertRowToContact = (row) => {
  const customFields = row
  const contact = {}
  for (let requiredField of CampaignContacts.requiredUploadFields) {
    console.log(requiredField, row[requiredField])
    contact[requiredField] = row[requiredField]
    // delete customFields[requiredField]
  }

  contact.customFields = customFields
  return contact
}
