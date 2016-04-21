export const applyScript = (script, contact) => {
  const fields = ['name']
  for(let field of fields){
    let re = new RegExp("<<" + field + ">>", "g");
    script = script.replace(re, contact[field]);
  }
  return script
};
