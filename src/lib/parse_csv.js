import Papa from "papaparse";
import _ from "lodash";
import { getFormattedPhoneNumber, getFormattedZip } from "../lib";

export const requiredUploadFields = ["firstName", "lastName", "cell"];
const topLevelUploadFields = [
  "firstName",
  "lastName",
  "cell",
  "zip",
  "external_id"
];

const getValidatedData = data => {
  let validatedData;
  let result;
  // For some reason destructuring is not working here
  result = _.partition(data, row => !!row.cell);
  validatedData = result[0];
  const missingCellRows = result[1];

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
    const contactInput = {
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
  const { rowTransformer, headerTransformer } = options || {};
  Papa.parse(file, {
    header: true,
    ...(headerTransformer && { transformHeader: headerTransformer }),
    skipEmptyLines: true,
    // eslint-disable-next-line no-shadow, no-unused-vars
    complete: ({ data: parserData, meta, errors }, file) => {
      const fields = meta.fields;
      const missingFields = [];

      let data = parserData;
      let transformerResults = {
        rows: [],
        fields: []
      };
      if (rowTransformer) {
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

      for (const field of requiredUploadFields) {
        if (fields.indexOf(field) === -1) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        const error = `Missing fields: ${missingFields.join(", ")}`;
        onCompleteCallback({ error });
      } else {
        const { validationStats, validatedData } = getValidatedData(data);

        const customFields = fields.filter(
          field => topLevelUploadFields.indexOf(field) === -1
        );

        const contactsWithCustomFields = organizationCustomFields(
          validatedData,
          customFields
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
