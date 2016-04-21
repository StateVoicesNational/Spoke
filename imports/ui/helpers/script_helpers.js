export const applyScript = (script, contact) => {
  for(let field of contact.scriptFields()){
    let re = new RegExp("<<" + field + ">>", "g");
    script = script.replace(re, contact.getScriptField(field));
  }
  return script
};
