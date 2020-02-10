import Papa from "papaparse";
import _ from "lodash";
import { getFormattedPhoneNumber, getFormattedZip } from "../lib";
import humps from "humps";

const requiredUploadFields = ["firstName", "lastName", "cell"];
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

const ensureCamelCaseRequiredHeaders = columnHeader => {
  /*
   * This function changes:
   *  first_name to firstName
   *  last_name to lastName
   *
   * It changes no other fields.
   *
   * If other fields that could be either snake_case or camelCase
   * are added to `requiredUploadFields` it will do the same for them.
   * */
  const camelizedColumnHeader = humps.camelize(columnHeader);
  if (
    requiredUploadFields.includes(camelizedColumnHeader) &&
    camelizedColumnHeader !== columnHeader
  ) {
    return camelizedColumnHeader;
  }

  return columnHeader;
};

export const parseCSV = (file, callback) => {
  Papa.parse(file, {
    header: true,
    transformHeader: ensureCamelCaseRequiredHeaders,
    // eslint-disable-next-line no-shadow, no-unused-vars
    complete: ({ data, meta, errors }, file) => {
      const fields = meta.fields;
      const missingFields = [];

      for (const field of requiredUploadFields) {
        if (fields.indexOf(field) === -1) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        const error = `Missing fields: ${missingFields.join(", ")}`;
        callback({ error });
      } else {
        const { validationStats, validatedData } = getValidatedData(data);

        const customFields = fields.filter(
          field => topLevelUploadFields.indexOf(field) === -1
        );

        callback({
          customFields,
          validationStats,
          contacts: validatedData
        });
      }
    }
  });
};
