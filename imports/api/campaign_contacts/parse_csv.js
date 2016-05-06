import { CampaignContacts } from './campaign_contacts.js'

export const parseCSV  = (file, callback) => {
  const formatHeader = (chunk) => {
      // No other easy way to modify headings
      // before PapaParse creates JSON for us
      var rows = chunk.split( /\r\n|\r|\n/ );
      var headings = rows[0].toLowerCase();
      rows[0] = headings;
      return rows.join("\r\n");
  }
  Papa.parse(file, {
    header: true,
    beforeFirstChunk: formatHeader,
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
