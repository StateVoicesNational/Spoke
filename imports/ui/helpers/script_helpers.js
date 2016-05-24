import { delimit, delimiters } from '../../api/campaigns/scripts'
import { CampaignContacts } from '../../api/campaign_contacts/campaign_contacts'

export const scriptFields = (customFields) => customFields.concat(
  CampaignContacts.requiredUploadFields).concat(
    CampaignContacts.userScriptFields
  )

const getScriptField = (contact, fieldName) => {
  let result
  if (fieldName === 'texterFirstName') {
    result = Meteor.user().firstName
  } else if (fieldName === 'texterLastName') {
    result = Meteor.user().lastName
  } else if (CampaignContacts.requiredUploadFields.indexOf(fieldName) !== -1) {
    result = contact[fieldName]
  } else {
    result = contact.customFields[fieldName]
  }

  return result
}

export const applyScript = (script, contact, scriptFields) => {
  if (!script) {
    console.log("missing script!", script)
    return ''
  }
  console.log("scriptfields", scriptFields)
  // FIXME
  let appliedScript = script
  for (const field of scriptFields.concat(CampaignContacts.userScriptFields)) {
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
