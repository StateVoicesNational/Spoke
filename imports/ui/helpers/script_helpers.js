export const applyScript = (script, contact) => {
  let appliedScript = script
  for (const field of contact.scriptFields()) {
    const re = new RegExp(`<<${field}>>`, 'g')
    console.log("apply script", appliedScript)
    appliedScript = appliedScript.replace(re, contact.getScriptField(field))
  }
  return appliedScript
}
