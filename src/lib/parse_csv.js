import Papa from "papaparse";
import _ from "lodash";
import { getFormattedPhoneNumber, getFormattedZip } from "../lib";

export const requiredUploadFields = ["firstName", "lastName", "cell"];

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
  lastName: [
    "last",
    "lastname",
    "lastName",
    "familyname",
    "familyName",
    "surname"
  ],
  cell: [
    "cell",
    "mobile",
    "number",
    "phone",
    "phone_number",
    "phonenumber",
    "cellphone",
    "mobilenumber",
    "mobileNumber",
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
    "zipOrPost",
    "ZipOrPostal"
  ],
  external_id: ["external_id", "externalId", "externalid"]
};

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
  //Below unfortunately creates dupes for same zip
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
  // options is a custom object that currently supports three properties:
  // * rowTransformer (not called or supplied in this project but set up for
  //   use if desired on line 148)-- a function that gets called on each row in the file
  //   after it is parsed. It takes 2 parameters, an array of fields and
  //   the object that results from parsing the row. It returns an object
  //   after transformation. The function can do lookups, field mappings,
  //   remove fields, add fields, etc. If it adds fields, it should push
  //   them onto the fields array in the first parameter.
  // * headerTransformer -- a function that gets called once after the
  //   header row is parsed. It takes one parameter, the header name, and
  //   returns the header that should be used for the column. An example
  //   would be to transform first_name to firstName, which is a required
  //   field in Spoke.
  // * additionalCustomFields (not called or supplied in this project)

  const { rowTransformer, headerTransformer, additionalCustomFields = [] } =
    options || {};
  Papa.parse(file, {
    header: true,
    ...(headerTransformer && { transformHeader: headerTransformer }),
    skipEmptyLines: true,
    // eslint-disable-next-line no-shadow, no-unused-vars
    complete: ({ data: parserData, meta, errors }, file) => {
      const fields = meta.fields;
      let missingFields = [];
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

      let customFields = fields.filter(field => {
        return !Object.keys(topLevelUploadFields).includes(field);
      });
      missingFields = requiredUploadFields.reduce((acc, field, index) => {
        if (!fields.includes(field)) {
          acc.push(field);
        }
        return acc;
      }, []);

      if (missingFields.length > 0) {
        const error = `Missing fields: ${missingFields.join(", ")}`;
        onCompleteCallback({ error });
      } else {
        const { validationStats, validatedData } = getValidatedData(data);
        customFields = [...customFields, ...additionalCustomFields];
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

const clean = str => str && str.toLowerCase().trim();

const parseTags = (org_tags, tag_text) => {
  const tagIds = [];
  if (tag_text) {
    for (var t of tag_text.split(",")) {
      const tag_name = clean(t);

      if (!tag_name) continue;

      const tag = org_tags.find(tag => clean(tag.name) == tag_name);

      if (!tag) {
        throw `"${tag_name}" cannot be found in your organization's tags`;
      }

      tagIds.push(tag.id);
    }
  }

  return tagIds;
};

const parseAction = (availableActions, actionText, actionDataText) => {
  const actionClean = clean(actionText);
  const actionDataClean = clean(actionDataText);

  if (!actionClean) return {};

  const availableAction = availableActions.find(
    x => clean(x.displayName) === actionClean
  );

  if (!availableAction) throw `"${actionText}" is not a valid action`;

  let actionData;
  if (
    availableAction.clientChoiceData &&
    availableAction.clientChoiceData.length
  ) {
    if (!actionDataClean)
      throw `Action data choice is required for action ${actionText}`;

    const actionDataChoice = availableAction.clientChoiceData.find(
      x => clean(x.name) === actionDataClean
    );

    if (!actionDataChoice)
      throw `"${actionDataText}" is not a valid action data choice`;

    actionData = JSON.stringify({
      label: actionDataChoice.name,
      value: actionDataChoice.details
    });
  }

  return {
    action: availableAction.name,
    actionData
  };
};

export const parseCannedResponseCsv = (
  file,
  availableActions,
  tags,
  onCompleteCallback
) => {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    // eslint-disable-next-line no-shadow, no-unused-vars
    complete: ({ data: parserData, meta, errors }, file) => {
      let cannedResponseRows = parserData;

      const titleLabel = meta.fields.find(f => clean(f) == "title");
      const textLabel = meta.fields.find(f => clean(f) == "text");
      const actionLabel = meta.fields.find(f => clean(f) == "action");
      const actionDataLabel = meta.fields.find(f => clean(f) == "actiondata");
      const tagsLabel = meta.fields.find(f => clean(f) == "tags");

      const missingFields = [];

      if (!titleLabel) missingFields.push("Title");
      if (!textLabel) missingFields.push("Text");

      if (missingFields.length) {
        onCompleteCallback({
          error: `Missing columns: ${missingFields.join(", ")}`
        });
        return;
      }

      const cannedResponses = [];

      // Loop through canned responses in CSV
      for (var response of cannedResponseRows) {
        // Get basic details of canned response
        const newCannedResponse = {
          title: response[titleLabel].trim(),
          text: response[textLabel].trim()
        };

        // Skip line if no title/text, error if only one empty
        if (!newCannedResponse.title && !newCannedResponse.text) {
          continue;
        }

        if (!newCannedResponse.title || !newCannedResponse.text) {
          onCompleteCallback({
            error: `Incomplete Line. Title: ${newCannedResponse.title}; Text: ${newCannedResponse.text}`
          });
          return;
        }

        try {
          const { action, actionData } = parseAction(
            availableActions,
            response[actionLabel],
            response[actionDataLabel]
          );

          newCannedResponse.answerActions = action;
          newCannedResponse.answerActionsData = actionData;
        } catch (error) {
          onCompleteCallback({ error });
          return;
        }

        try {
          newCannedResponse.tagIds = parseTags(tags, response[tagsLabel]);
        } catch (error) {
          onCompleteCallback({ error });
          return;
        }

        cannedResponses.push(newCannedResponse);
      }

      onCompleteCallback({
        error: null,
        cannedResponses
      });
    }
  });
};
