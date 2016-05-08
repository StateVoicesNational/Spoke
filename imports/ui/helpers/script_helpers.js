import { delimit, delimiters } from '../../api/campaigns/scripts'

export const applyScript = (script, contact) => {
  let appliedScript = script
  for (const field of contact.scriptFields()) {
    const re = new RegExp(`${delimit(field)}`, 'g')
    console.log("apply script", appliedScript)
    appliedScript = appliedScript.replace(re, contact.getScriptField(field))
  }
  return appliedScript
}

export const findScriptVariable = (text) => {
  const { startDelimiter, endDelimiter } = delimiters
  const re = new RegExp(`${startDelimiter}[^${startDelimiter}]*${endDelimiter}`, 'g')
  // const re = new RegExp('{smee}', 'g')
  console.log(text.match(re))
}