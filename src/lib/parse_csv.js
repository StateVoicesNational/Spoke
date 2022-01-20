import Papa from "papaparse";
import _ from "lodash";
import { getFormattedPhoneNumber, getFormattedZip } from "../lib";

export const requiredUploadFields = {
  firstName: [
    "firstname",
    "givenname",
    "given_name",
    "f_name",
    "first",
    "firstName"
  ],
  lastName: ["lastname", "familyname", "family_name", "lastName"],
  cell: [
    "cell",
    "cellphone",
    "cellPhone",
    "CellPhone",
    "mobile",
    "number",
    "phone",
    "phone number",
    "phoneNumber",
    "mobilenumber",
    "mobileNumber"
  ]
};

export const topLevelUploadFields = {
  firstName: [
    "firstname",
    "firstName",
    "givenname",
    "givenName",
    "f_name",
    "first",
    "name"
  ],
  lastName: ["lastname", "lastName", "familyname", "familyName", "surname"],
  cell: [
    "cell",
    "mobile",
    "number",
    "phone",
    "phone_number",
    "phonenumber",
    "cellphone",
    "mobilenumber",
    "mobile_number",
    "cellPhone"
  ],
  zip: [
    "zip",
    "zipcode",
    "zipCode",
    "postnumber",
    "postNumber",
    "postalcode",
    "postalCode",
    "postalnumber",
    "postalNumber",
    "ZipOrPostal"
  ],
  external_id: ["external_id"]
};
const getValidatedData = data => {
  let validatedData;
  let result;
  // For some reason destructuring is not working here
  result = _.partition(data, row => !!row.cell);
  console.log("Result: ", result);
  validatedData = result[0];
  const missingCellRows = result[1];
  // Here there are missing fields that haven't been camel-checked
  console.log("VALID: ", validatedData, "MISSING: ", missingCellRows);

  validatedData = _.map(validatedData, row =>
    _.extend(row, {
      cell: getFormattedPhoneNumber(
        row.cell,
        process.env.PHONE_NUMBER_COUNTRY || "US"
      )
    })
  );
  result = _.partition(validatedData, row => !!row.cell);
  validatedData = result[0];
  const invalidCellRows = result[1];

  const count = validatedData.length;
  validatedData = _.uniqBy(validatedData, row => row.cell);
  const dupeCount = count - validatedData.length;

  validatedData = _.map(validatedData, row =>
    _.extend(row, {
      zip: row.zip ? getFormattedZip(row.zip) : null
    })
  );
  const zipCount = validatedData.filter(row => !!row.zip).length;

  return {
    validatedData,
    validationStats: {
      dupeCount,
      invalidCellCount: invalidCellRows.length,
      missingCellCount: missingCellRows.length,
      zipCount
    }
  };
};

export const organizationCustomFields = (contacts, customFieldsList) => {
  return contacts.map(contact => {
    const customFields = {};
    console.log("contact: ", contact);
    //THIS is where we either need to transform headers or have them transformed already
    const contactInput = {
      //cell: contact[topLevelUploadFields.cell[Object.keys(cell)]],
      cell: contact.cell,
      first_name: contact.firstName,
      last_name: contact.lastName,
      zip: contact.zip || "",
      external_id: contact.external_id || ""
    };
    customFieldsList.forEach(key => {
      if (contact.hasOwnProperty(key)) {
        customFields[key] = contact[key];
      }
    });
    contactInput.custom_fields = JSON.stringify(customFields);
    console.log("contactInput: ", contactInput);
    return contactInput;
  });
};

export const parseCSV = (file, onCompleteCallback, options) => {
  // options is a custom object that currently supports two properties
  // rowTransformer -- a function that gets called on each row in the file
  //   after it is parsed. It takes 2 parameters, an array of fields and
  //   the object that results from parsing the row. It returns an object
  //   after transformation. The function can do lookups, field mappings,
  //   remove fields, add fields, etc. If it adds fields, it should push
  //   them onto the fields array in the first parameter.
  // headerTransformer -- a function that gets called once after the
  //   header row is parsed. It takes one parameter, the header name, and
  //   returns the header that should be used for the column. An example
  //   would be to transform first_name to firstName, which is a required
  //   field in Spoke.
  const { rowTransformer, headerTransformer, additionalCustomFields = [] } =
    options || {};
  Papa.parse(file, {
    header: true,
    ...(headerTransformer && { transformHeader: headerTransformer }),
    skipEmptyLines: true,
    // eslint-disable-next-line no-shadow, no-unused-vars
    complete: ({ data: parserData, meta, errors }, file) => {
      const fields = meta.fields;
      console.log("Fields line 154:", meta.fields);
      const missingFields = [];

      let data = parserData;
      let transformerResults = {
        rows: [],
        fields: []
      };
      if (rowTransformer) {
        console.log("ROW TRANSFORMER EXISTS");
        transformerResults = parserData.reduce((results, originalRow) => {
          const { row, addedFields } = rowTransformer(fields, originalRow);
          results.rows.push(row);
          addedFields.forEach(field => {
            if (!fields.includes(field)) {
              fields.push(field);
            }
          });
          return results;
        }, transformerResults);
        data = transformerResults.rows;
      }

      for (const field of Object.keys(requiredUploadFields)) {
        if (requiredUploadFields[field].indexOf(field) === -1) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        const error = `Missing fields: ${missingFields.join(", ")}`;
        onCompleteCallback({ error });
      } else {
        console.log("data that needs to be field-corrected: ", data);
        const { validationStats, validatedData } = getValidatedData(data);
        console.log("Meta Fields to find custom fields: ", fields);
        let customFields = fields.filter(field =>
          Object.values(topLevelUploadFields).find(e => e.indexOf(field) === -1)
        );
        console.log("Custom fields made from meta fields: ", customFields);
        customFields = [...customFields, ...additionalCustomFields];
        console.log(
          "Custom fields plus Additional Valid data: ",
          customFields,
          validatedData
        );
        const contactsWithCustomFields = organizationCustomFields(
          validatedData,
          customFields
        );
        console.log(
          "Contacts to send to OnCompleteCallback: ",
          contactsWithCustomFields
        );

        onCompleteCallback({
          customFields,
          validationStats,
          contacts: contactsWithCustomFields
        });
      }
    }
  });
};
