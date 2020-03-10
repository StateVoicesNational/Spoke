import { finalizeContactLoad } from "../helpers";
import { getConfig } from "../../../server/api/lib/config";
import { parseCSVAsync } from "../../../workers/parse_csv";

import _ from "lodash";
import { GraphQLError } from "graphql/error";
import axios from "axios";

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

export async function available(organization, user) {
  // / return an object with two keys: result: true/false
  // / these keys indicate if the ingest-contact-loader is usable
  // / Sometimes credentials need to be setup, etc.
  // / A second key expiresSeconds: should be how often this needs to be checked
  // / If this is instantaneous, you can have it be 0 (i.e. always), but if it takes time
  // / to e.g. verify credentials or test server availability,
  // / then it's better to allow the result to be cached
  // TODO
  const result = true;
  return {
    result,
    expiresSeconds: 60
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

// export function intermediateadmindatarequest(organization, campaign, user, datadetails, clientchoicedata) {
//   if (datadetails.startswith('page')) {
//      const choicedata = json.parse(clientchoicedata);
//     const page = datadetails.match(/page=(\d+)/)
//
//   }
// }

export async function getClientChoiceData(
  organization,
  campaign,
  user,
  loaders
) {
  let response;

  try {
    // TODO(lmp) so much to do here ... look for errors, retry, get multiple pages
    response = await axios({
      url: "https://api.securevan.com/v4/savedLists",
      method: "GET",
      headers: {
        Authorization: getVanAuth()
      },
      validateStatus: status => status === 200
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    throw new GraphQLError(error.message);
  }

  // / data to be sent to the admin client to present options to the component or similar
  // / The react-component will be sent this data as a property
  // / return a json object which will be cached for expiresSeconds long
  // / `data` should be a single string -- it can be JSON which you can parse in the client component
  return {
    data: `${JSON.stringify(_.get(response, "data.items", []))}`,
    expiresSeconds: 300
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
  const addedFields = ["external_id", "firstName", "lastName"];

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

export async function processContactLoad(job, maxContacts) {
  let response;
  try {
    // TODO(lmp) so much to do here ... look for errors, retry, get multiple pages
    response = await axios({
      url: "https://api.securevan.com/v4/exportJobs",
      method: "POST",
      headers: {
        Authorization: getVanAuth()
      },
      data: {
        savedListId: job.payload,
        type: getConfig("NGP_VAN_EXPORT_JOB_TYPE_ID"),
        webhookUrl: getConfig("NGP_VAN_WEBHOOK_URL")
      },
      validateStatus: status => status >= 200 && status < 300
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    throw new GraphQLError(error.message);
  }

  if (response.data.status !== "Completed") {
    // TODO(lmp) implement web hook to get called back when jobs complete
    const message = `Export job not immediately completed ${JSON.stringify(
      job
    )}`;
    // eslint-disable-next-line no-console
    console.log(message);
    throw new GraphQLError(message);
  }

  const downloadUrl = response.data.downloadUrl;

  try {
    const vanResponse = await axios({
      url: downloadUrl,
      method: "GET",
      validateStatus: status => status === 200
    });

    const vanContacts = vanResponse.data;

    // const parseCsvCallback = ({
    //   contacts,
    //   customFields,
    //   validationStats,
    //   error
    // }) => {
    //   if (error) {
    //     // TODO(lmp) call completeContactLoad
    //     console.log(error);
    //   } else if (contacts.length === 0) {
    //     // TODO(lmp) call completeContactLoad
    //   } else if (contacts.length > 0) {
    //     console.log("contacts.length", contacts.length);
    //   }
    // };

    const { validationStats, contacts } = await parseCSVAsync(
      vanContacts,
      rowTransformer
    );

    // ingestDataReference -- add list id
    // ingestResult -- payload describing what happened underdable by react component, warnings, stats,
    const ingestDataReference = "";
    const ingestResult = "";
    await finalizeContactLoad(
      job,
      contacts,
      maxContacts,
      ingestDataReference,
      ingestResult
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    // TODO(lmp) call failedContactLoad
    throw new GraphQLError(error.message);
  }
}
