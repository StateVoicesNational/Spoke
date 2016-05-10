import { delimit, delimiters } from '../../api/campaigns/scripts'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts'

export const scriptFields = (customFields) => customFields.concat(CampaignContacts.requiredUploadFields)

const getScriptField = (contact, fieldName) => {
  const isCustom = CampaignContacts.requiredUploadFields.indexOf(fieldName) === -1
  return isCustom ? contact.customFields[fieldName] : contact[fieldName]
}

export const applyScript = (script, contact, scriptFields) => {
  let appliedScript = script
  for (const field of scriptFields) {
    const re = new RegExp(`${delimit(field)}`, 'g')
    appliedScript = appliedScript.replace(re, getScriptField(contact, field))
  }
  return appliedScript
}

export const findScriptVariable = (text) => {
  const { startDelimiter, endDelimiter } = delimiters
  const re = new RegExp(`${startDelimiter}[^${startDelimiter}]*${endDelimiter}`, 'g')
  // const re = new RegExp('{smee}', 'g')
}
