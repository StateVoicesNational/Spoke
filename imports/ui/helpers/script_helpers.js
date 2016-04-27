export const applyScript = (script, contact) => {
  let appliedScript = script
  // for (const field of contact.scriptFields()) {
  //   const re = new RegExp(`<<${field}>>`, 'g')
  //   appliedScript = appliedScript.replace(re, contact.getScriptField(field))
  // }
  return appliedScript
}
