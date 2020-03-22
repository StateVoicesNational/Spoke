import { finalizeContactLoad } from "../helpers";
import { getConfig } from "../../../server/api/lib/config";
import { parseCSVAsync } from "../../../workers/parse_csv";
import { failedContactLoad } from "../../../workers/jobs";

import _ from "lodash";
import { getAxiosWithRetries } from "../../../server/lib/axiosWithRetries";

export const name = "ngpvan";

export function displayName() {
  return "NGP VAN";
}

const getVanAuth = () => {
  const buffer = Buffer.from(
    `${getConfig("NGP_VAN_APP_NAME")}:${getConfig("NGP_VAN_API_KEY")}|0`
  );
  return `Basic ${buffer.toString("base64")}`;
};

export function serverAdministratorInstructions() {
  return {
    environmentVariables: [],
    description: "",
    setupInstructions:
      "Nothing is necessary to setup since this is default functionality"
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
  // / A second key expireSeconds: should be how often this needs to be checked
  // / If this is instantaneous, you can have it be 0 (i.e. always), but if it takes time
  // / to e.g. verify credentials or test server availability,
  // / then it's better to allow the result to be cached
  // TODO
  const result = true;
  return {
    result,
    expireSeconds: 60
  };
}

export function addServerEndpoints(expressApp) {
  // / If you need to create API endpoints for server-to-server communication
  // / this is where you would run e.g. app.post(....)
  // / Be mindful of security and make sure there's
  // / This is NOT where or how the client send or receive contact data
  // TODO

  // expressApp.post('/ingest-data/ngpvan/:jobid/:maxcontacts/:listid', function(req, res) {
  //   const jobId = req.params.jobid
  //   const job = await r.knex("job").where('id', jobId)
  //   if (req.FILES.length) {
  //      await axios();
  //      finalizeContactData(req.FILES[0], job, req.params.maxcontacts);
  //   }
  //   res.send('ok');
  // });

  return;
}

export function clientChoiceDataCacheKey(organization, campaign, user) {
  // / returns a string to cache getClientChoiceData -- include items that relate to cacheability
  return `${organization.id}`;
}

export async function getClientChoiceData(
  organization,
  campaign,
  user,
  loaders
) {
  let response;

  try {
    const maxPeopleCount =
      Number(getConfig("NGP_VAN_MAXIMUM_LIST_SIZE")) || 75000;

    // The savedLists endpoint supports pagination; we are ignoring pagination now
    response = await getAxiosWithRetries()({
      url: `https://api.securevan.com/v4/savedLists?$top=&maxPeopleCount=${maxPeopleCount}`,
      method: "GET",
      headers: {
        Authorization: getVanAuth()
      },
      validateStatus: status => status === 200
    });
  } catch (error) {
    const message = `Error retrieving saved list metadata from VAN ${error}`;
    // eslint-disable-next-line no-console
    console.log(message);
    return { data: `${JSON.stringify({ error: message })}` };
  }

  // / data to be sent to the admin client to present options to the component or similar
  // / The react-component will be sent this data as a property
  // / return a json object which will be cached for expireSeconds long
  // / `data` should be a single string -- it can be JSON which you can parse in the client component
  return {
    data: `${JSON.stringify({ items: _.get(response, "data.items", []) })}`,
    expireSeconds: Number(getConfig("NGP_VAN_CACHE_TTL")) || 300
  };
}

export const getZipFromRow = row => {
  const regexes = [
    new RegExp(".*\\s(\\d{5})\\s*$"),
    new RegExp(".*\\s(\\d{5}-\\d{4})\\s*$")
  ];

  let zip = undefined;
  _.forEach(regexes, regex => {
    const matches = regex.exec(row.Address || "");
    if (matches) {
      zip = matches[1];
      return false; // stop iterating
    }
    return true;
  });

  return zip;
};

const countryCodeOk = countryCode =>
  !countryCode ||
  (countryCode && countryCode === (process.env.PHONE_NUMBER_COUNTRY || "US"));

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

export const getCellFromRow = row => {
  const phoneTypes = [
    { typeName: "Cell", assumeCellIfPresent: true },
    { typeName: "Home", assumeCellIfPresent: false },
    { typeName: "Work", assumeCellIfPresent: false }
  ];
  let cell = undefined;
  _.forEach(phoneTypes, phoneType => {
    cell = getPhoneNumberIfLikelyCell(phoneType, row);
    if (cell) {
      return false; // stop iterating
    }
    return true;
  });

  return cell;
};

export const rowTransformer = (originalFields, originalRow) => {
  const addedFields = ["external_id"];

  const row = {
    ...originalRow
  };

  row.cell = exports.getCellFromRow(originalRow);
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

export async function processContactLoad(job, maxContacts) {
  let response;
  const ingestDataReference = JSON.parse(job.payload);
  let vanResponse;
  let vanContacts;

  try {
    response = await getAxiosWithRetries()({
      url: "https://api.securevan.com/v4/exportJobs",
      method: "POST",
      headers: {
        Authorization: getVanAuth()
      },
      data: {
        savedListId: ingestDataReference.savedListId,
        type: getConfig("NGP_VAN_EXPORT_JOB_TYPE_ID"),
        webhookUrl: getConfig("NGP_VAN_WEBHOOK_URL")
      },
      validateStatus: status => status >= 200 && status < 300
    });
  } catch (error) {
    await exports.handleFailedContactLoad(
      job,
      ingestDataReference,
      `Error requesting VAN export job. ${error}`
    );
    return;
  }

  if (response.data.status !== "Completed") {
    // TODO handle status === "Error" or "Requested"
    // TODO(lmp) implement web hook to get called back when jobs complete
    const message = `Export job not immediately completed ${JSON.stringify(
      job
    )}`;
    // eslint-disable-next-line no-console
    console.log(message);
  }

  // TODO check for errors in the response

  const downloadUrl = response.data.downloadUrl;

  try {
    vanResponse = await getAxiosWithRetries()({
      url: downloadUrl,
      method: "GET",
      validateStatus: status => status === 200
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
    vanContacts = vanResponse.data;

    const { validationStats, contacts } = await parseCSVAsync(vanContacts, {
      rowTransformer,
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
