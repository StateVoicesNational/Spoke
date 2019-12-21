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

const getValidatedData = (data, optOuts) => {
  const optOutCells = optOuts.map(optOut => optOut.cell);
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

  result = _.partition(
    validatedData,
    row => optOutCells.indexOf(row.cell) === -1
  );
  validatedData = result[0];
  const optOutRows = result[1];

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
      optOutCount: optOutRows.length,
      invalidCellCount: invalidCellRows.length,
      missingCellCount: missingCellRows.length,
      zipCount
    }
  };
};

const ensureCamelCaseRequiredHeaders = columnHeader => {
  const camelizedColumnHeader = humps.camelize(columnHeader);

  if (
    requiredUploadFields.includes(camelizedColumnHeader) &&
    camelizedColumnHeader !== columnHeader
  ) {
    return camelizedColumnHeader;
  }

  return columnHeader;
};

export const parseCSV = (file, optOuts, callback) => {
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
        const { validationStats, validatedData } = getValidatedData(
          data,
          optOuts
        );

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
