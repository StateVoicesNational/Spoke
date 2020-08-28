export const delimiters = {
  startDelimiter: "{",
  endDelimiter: "}"
};

export const delimit = text => {
  const { startDelimiter, endDelimiter } = delimiters;
  return `${startDelimiter}${text}${endDelimiter}`;
};

// const REQUIRED_UPLOAD_FIELDS = ['firstName', 'lastName', 'cell']
const TOP_LEVEL_UPLOAD_FIELDS = [
  "firstName",
  "lastName",
  "cell",
  "zip",
  "external_id"
];
const TEXTER_SCRIPT_FIELDS = ["texterLastName", "texterAliasOrFirstName"];

const DEPRECATED_SCRIPT_FIELDS = ["texterFirstName"];

// Fields that should be capitalized when a script is applied
const CAPITALIZE_FIELDS = [
  "firstName",
  "lastName",
  "texterFirstName",
  "texterLastName",
  "texterAliasOrFirstName"
];

// TODO: This will include zipCode even if you ddin't upload it
export const allScriptFields = (customFields, includeDeprecated) =>
  TOP_LEVEL_UPLOAD_FIELDS.concat(TEXTER_SCRIPT_FIELDS)
    .concat(customFields)
    .concat(includeDeprecated ? DEPRECATED_SCRIPT_FIELDS : []);

const capitalize = str => {
  const strTrimmed = str.trim();
  return strTrimmed.charAt(0).toUpperCase() + strTrimmed.slice(1).toLowerCase();
};

const getScriptFieldValue = (contact, texter, fieldName) => {
  let result;
  if (fieldName === "texterAliasOrFirstName") {
    result = texter.alias ? texter.alias : texter.firstName;
  } else if (fieldName === "texterFirstName") {
    result = texter.firstName;
  } else if (fieldName === "texterLastName") {
    result = texter.lastName;
  } else if (TOP_LEVEL_UPLOAD_FIELDS.indexOf(fieldName) !== -1) {
    result = contact[fieldName];
  } else {
    const customFieldNames = JSON.parse(contact.customFields);
    result = customFieldNames[fieldName];
  }

  if (CAPITALIZE_FIELDS.indexOf(fieldName) >= 0) {
    result = capitalize(result);
  }

  return result;
};

export const applyScript = ({ script, contact, customFields, texter }) => {
  const scriptFields = allScriptFields(customFields, true);
  let appliedScript = script;

  for (const field of scriptFields) {
    const re = new RegExp(`${delimit(field)}`, "g");
    appliedScript = appliedScript.replace(
      re,
      getScriptFieldValue(contact, texter, field)
    );
  }
  return appliedScript;
};
