import humps from "humps";

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

const SYSTEM_FIELDS = ["contactId", "contactIdBase62"];

export const coreFields = {
  firstName: 1,
  lastName: 1,
  texterFirstName: 1,
  texterLastName: 1,
  texterAliasOrFirstName: 1,
  cell: 1,
  zip: 1,
  external_id: 1,
  contactId: 1,
  contactIdBase62: 1
};

// TODO: This will include zipCode even if you didn't upload it
export const allScriptFields = (customFields, includeDeprecated) =>
  TOP_LEVEL_UPLOAD_FIELDS.concat(TEXTER_SCRIPT_FIELDS)
    .concat(customFields)
    .concat(SYSTEM_FIELDS)
    .concat(includeDeprecated ? DEPRECATED_SCRIPT_FIELDS : []);

const capitalize = str => {
  const strTrimmed = str.trim();
  if (
    strTrimmed.charAt(0).toUpperCase() === strTrimmed.charAt(0) &&
    /[a-z]/.test(strTrimmed)
  ) {
    // first letter is upper-cased and some lowercase
    // so then let's return as-is.
    return strTrimmed;
  }
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
  } else if (fieldName === "contactId") {
    result = String(contact.id);
  } else if (fieldName === "contactIdBase62") {
    let n = Number(contact.id);
    if (n === 0) {
      return "0";
    }
    const digits =
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    result = "";
    while (n > 0) {
      result = digits[n % digits.length] + result;
      n = parseInt(n / digits.length, 10);
    }
  } else if (TOP_LEVEL_UPLOAD_FIELDS.indexOf(fieldName) !== -1) {
    // Defensive code in case CSV is not formatted correctly
    const contactKeysArray = Object.keys(contact);
    
    // Check the syntax of the strings in the contactKeysArray
    let isSnakeCase = true;
    let snake_field_name;
    for (const key of contactKeysArray) {
      if (!key.match(/^[a-z0-9_]+$/i)) {
        isSnakeCase = false;
        break;
      }
    }
    
    if (isSnakeCase) {
      snake_field_name = humps.decamelize(fieldName);
      result = contact[snake_field_name];
    } else {
      result = contact[fieldName];
    }
  } else {
    // Custom field logic
    let customFieldObj = {};
    
    if (typeof contact["custom_fields"] === "string") {
      customFieldObj = JSON.parse(contact["custom_fields"]);
    }
    result = customFieldObj[fieldName];
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
    try {
      const re = new RegExp(`${delimit(field)}`, "g");
      appliedScript = appliedScript.replace(
        re,
        getScriptFieldValue(contact, texter, field)
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }
  return appliedScript;
};
