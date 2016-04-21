export const applyScript = (script, contact) => {
  for(let field of contact.scriptFields()) {
    console.log(field)
    let re = new RegExp("<<" + field + ">>", "g");
    script = script.replace(re, contact.getScriptField(field));
  }
  return script
};
