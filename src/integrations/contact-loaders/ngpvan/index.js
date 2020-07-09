import { finalizeContactLoad } from "../helpers";
import { getConfig } from "../../../server/api/lib/config";
import { parseCSVAsync } from "../../../workers/parse_csv";
import { failedContactLoad } from "../../../workers/jobs";
import HttpRequest from "../../../server/lib/http-request.js";
import Van from "./util";

export const name = "ngpvan";

export const DEFAULT_NGP_VAN_MAXIMUM_LIST_SIZE = 75000;
export const DEFAULT_NGP_VAN_CACHE_TTL = 300;
export const DEFAULT_NGP_VAN_EXPORT_JOB_TYPE_ID = 8;
export const DEFAULT_PHONE_NUMBER_COUNTRY = "US";

export function displayName() {
  return "NGP VAN";
}

export function serverAdministratorInstructions() {
  return {
    description:
      "Load contacts from VAN (and LAN, everyaction, etc.) saved lists",
    setupInstructions:
      "Get an APP name and API key for your VAN account. Add them to your config, along with NGP_VAN_WEBHOOK_BASE_URL. In most cases the defaults for the other environment variables will work",
    environmentVariables: [
      "NGP_VAN_API_KEY",
      "NGP_VAN_API_BASE_URL",
      "NGP_VAN_APP_NAME",
      "NGP_VAN_CACHE_TTL",
      "NGP_VAN_EXPORT_JOB_TYPE_ID",
      "NGP_VAN_MAXIMUM_LIST_SIZE",
      "NGP_VAN_WEBHOOK_BASE_URL",
      "NGP_VAN_CAUTIOUS_CELL_PHONE_SELECTION"
    ]
  };
}

export const handleFailedContactLoad = async (
  job,
  ingestDataReference,
  message
) => {
  // eslint-disable-next-line no-console
  console.error(message);
  await failedContactLoad(job, null, JSON.stringify(ingestDataReference), {
    errors: [message],
    ...ingestDataReference
  });
};

export async function available(organization, user) {
  // / return an object with two keys: result: true/false
  // / these keys indicate if the ingest-contact-loader is usable
  // / Sometimes credentials need to be setup, etc.
  // / A second key expiresSeconds: should be how often this needs to be checked
  // / If this is instantaneous, you can have it be 0 (i.e. always), but if it takes time
  // / to e.g. verify credentials or test server availability,
  // / then it's better to allow the result to be cached

  const result =
    !!getConfig("NGP_VAN_API_KEY", organization) &&
    !!getConfig("NGP_VAN_APP_NAME", organization) &&
    !!getConfig("NGP_VAN_WEBHOOK_BASE_URL", organization);

  if (!result) {
    console.log(
      "ngpvan contact loader unavailable. Missing one or more required environment variables."
    );
  }

  return {
    result,
    expiresSeconds: 86400
  };
}

export function addServerEndpoints(expressApp) {
  // this method allows us to add server endpoint to serve as a webhook for external systems
  // For example, VAN will call this webhook when a contact export is complete on their end
  // Currently, this is implemented by VAN as a placeholder, it carries no meaningful data and
  // is included here for illustrative purposes.
  expressApp.post(
    "/integration/ngpvan/ingest/:jobId/:maxContacts/:vanListId",
    function(req, res) {
      const { jobId, maxContacts, vanListId } = req.params;
      console.log(
        "Received callback from VAN with parameters: jobId, maxContacts, vanListId",
        jobId,
        maxContacts,
        vanListId
      );
      res.send("OK");
    }
  );
}

export function clientChoiceDataCacheKey(organization, campaign, user) {
  // / returns a string to cache getClientChoiceData -- include items that relate to cacheability
  return `${organization.id}`;
}

export async function getClientChoiceData(organization, campaign, user) {
  let responseJson;

  try {
    const maxPeopleCount =
      Number(getConfig("NGP_VAN_MAXIMUM_LIST_SIZE", organization)) ||
      DEFAULT_NGP_VAN_MAXIMUM_LIST_SIZE;

    const url = Van.makeUrl(
      `v4/savedLists?$top=&maxPeopleCount=${maxPeopleCount}`,
      organization
    );

    // The savedLists endpoint supports pagination; we are ignoring pagination now
    const response = await HttpRequest(url, {
      method: "GET",
      headers: {
        Authorization: Van.getAuth(organization)
      },
      retries: 0,
      timeout: 5000
    });

    responseJson = await response.json();
  } catch (error) {
    const message = `Error retrieving saved list metadata from VAN ${error}`;
    // eslint-disable-next-line no-console
    console.log(message);
    return { data: `${JSON.stringify({ error: message })}` };
  }

  // / data to be sent to the admin client to present options to the component or similar
  // / The react-component will be sent this data as a property
  // / return a json object which will be cached for expiresSeconds long
  // / `data` should be a single string -- it can be JSON which you can parse in the client component
  return {
    data: `${JSON.stringify(responseJson)}`,
    expiresSeconds:
      Number(getConfig("NGP_VAN_CACHE_TTL", organization)) ||
      DEFAULT_NGP_VAN_CACHE_TTL
  };
}

export const getZipFromRow = row => {
  const regexes = [
    new RegExp(".*\\s(\\d{5})\\s*$"),
    new RegExp(".*\\s(\\d{5}-\\d{4})\\s*$")
  ];

  let zip;
  regexes.some(regex => {
    const matches = regex.exec(row.Address || "");
    if (matches) {
      zip = matches[1];
      return true; // stop iterating
    }
    return false;
  });

  return zip;
};

const countryCodeOk = countryCode =>
  !countryCode ||
  (countryCode &&
    countryCode ===
      (process.env.PHONE_NUMBER_COUNTRY || DEFAULT_PHONE_NUMBER_COUNTRY));

const treatAsCellPhone = (isCellPhone, assumeCellPhone) =>
  assumeCellPhone || (isCellPhone && Number(isCellPhone));

const getPhoneNumberIfLikelyCell = (phoneType, row) => {
  const phoneKey = `${phoneType.typeName}Phone`;
  const dialingPrefixKey = `${phoneType.typeName}PhoneDialingPrefix`;
  const countryCodeKey = `${phoneType.typeName}PhoneCountryCode`;
  const isCellPhoneKey = `Is${phoneType.typeName}PhoneACellExchange`;

  if (row[phoneKey]) {
    if (
      countryCodeOk(row[countryCodeKey]) &&
      treatAsCellPhone(row[isCellPhoneKey], phoneType.assumeCellIfPresent)
    ) {
      return `${row[dialingPrefixKey]}${row[phoneKey]}`;
    }
  }

  return undefined;
};

export const getCellFromRow = (row, cautious = true) => {
  const phoneTypes = [
    { typeName: "Cell", assumeCellIfPresent: true },
    { typeName: "OptIn", assumeCellIfPresent: !cautious || false },
    { typeName: "", assumeCellIfPresent: !cautious || false },
    { typeName: "Home", assumeCellIfPresent: !cautious || false },
    { typeName: "Work", assumeCellIfPresent: !cautious || false }
  ];
  let cell = undefined;
  phoneTypes.some(phoneType => {
    cell = getPhoneNumberIfLikelyCell(phoneType, row);
    if (cell) {
      return true; // stop iterating
    }
    return false;
  });

  return cell;
};

export const makeRowTransformer = (cautious = true) => (
  originalFields,
  originalRow
) => {
  const addedFields = ["external_id"];

  const row = {
    ...originalRow
  };

  row.cell = exports.getCellFromRow(originalRow, cautious);
  if (row.cell) {
    addedFields.push("cell");
  }

  row.zip = exports.getZipFromRow(originalRow);
  if (row.zip) {
    addedFields.push("zip");

    // const timeZone = getTimezoneByZip(row.zip);
    // if (timeZone) {
    //   row.timezone_offset = timeZone;
    //   addedFields.push("timezone_offset");
    // }
  }

  row.external_id = row.VanID;

  return { row, addedFields };
};

export const headerTransformer = header => {
  switch (header) {
    case "FirstName":
      return "firstName";
    case "LastName":
      return "lastName";
    default:
      return header;
  }
};

export async function processContactLoad(job, maxContacts, organization) {
  let responseJson;
  const ingestDataReference = JSON.parse(job.payload);
  let vanResponse;
  let vanContacts;

  const webhookUrl = `${getConfig(
    "NGP_VAN_WEBHOOK_BASE_URL",
    organization
  )}/ingest-data/ngpvan/${job.id}/${maxContacts || 0}/${
    ingestDataReference.savedListId
  }`;

  try {
    const url = Van.makeUrl("v4/exportJobs", organization);
    const response = await HttpRequest(url, {
      method: "POST",
      retries: 0,
      timeout: 5000,
      headers: {
        Authorization: Van.getAuth(organization),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        savedListId: ingestDataReference.savedListId,
        type:
          getConfig("NGP_VAN_EXPORT_JOB_TYPE_ID", organization) ||
          DEFAULT_NGP_VAN_EXPORT_JOB_TYPE_ID,
        webhookUrl
      }),
      statusValidationFunction: status => {
        return status >= 200 && status < 300;
      },
      compress: false
    });
    responseJson = await response.json();
  } catch (error) {
    await exports.handleFailedContactLoad(
      job,
      ingestDataReference,
      `Error requesting VAN export job. ${error}`
    );
    return;
  }

  if (responseJson.status === "Error") {
    await exports.handleFailedContactLoad(
      job,
      ingestDataReference,
      `Error requesting VAN export job. VAN returned error code ${responseJson.errorCode}`
    );
    return;
  }

  if (responseJson.status !== "Completed") {
    await exports.handleFailedContactLoad(
      job,
      ingestDataReference,
      `Unexpected response when requesting VAN export job. VAN returned status ${responseJson.status}`
    );
    return;
  }

  const downloadUrl = responseJson.downloadUrl;

  try {
    vanResponse = await HttpRequest(downloadUrl, {
      method: "GET",
      retries: 0,
      timeout: 5000
    });
  } catch (error) {
    await exports.handleFailedContactLoad(
      job,
      ingestDataReference,
      `Error downloading VAN contacts. ${error}`
    );
    return;
  }

  let parserContacts;
  let parserValidationStats;

  try {
    const vanContacts = await vanResponse.text();
    const cautiousCellPhoneSelection =
      getConfig("NGP_VAN_CAUTIOUS_CELL_PHONE_SELECTION", organization) ===
      "true";

    const { validationStats, contacts } = await parseCSVAsync(vanContacts, {
      rowTransformer: exports.makeRowTransformer(cautiousCellPhoneSelection),
      headerTransformer
    });

    if (contacts.length === 0) {
      await exports.handleFailedContactLoad(
        job,
        ingestDataReference,
        "No contacts ingested. Check the selected list."
      );
      return;
    }

    parserContacts = contacts;
    parserValidationStats = validationStats;
  } catch (error) {
    await exports.handleFailedContactLoad(
      job,
      ingestDataReference,
      `Error parsing VAN response. ${error}`
    );
    return;
  }

  try {
    const ingestResult = parserValidationStats;

    await finalizeContactLoad(
      job,
      parserContacts,
      maxContacts,
      JSON.stringify(ingestDataReference),
      ingestResult
    );
  } catch (error) {
    await exports.handleFailedContactLoad(
      job,
      ingestDataReference,
      `Error loading VAN contacts to the database. ${error}`
    );
    return;
  }
}
