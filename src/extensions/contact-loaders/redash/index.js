import { parseCSV } from "../../../lib";
import { finalizeContactLoad } from "../helpers";
import { completeContactLoad, failedContactLoad } from "../../../workers/jobs";
import { Tasks } from "../../../workers/tasks";
import { jobRunner } from "../../job-runners";
import { r, cacheableData } from "../../../server/models";
import { getConfig, hasConfig } from "../../../server/api/lib/config";
import httpRequest from "../../../server/lib/http-request";

export const name = "redash";

export function displayName() {
  return "Redash";
}

export function serverAdministratorInstructions() {
  return {
    environmentVariables: ["REDASH_BASE_URL", "REDASH_USER_API_KEY"],
    description: "",
    setupInstructions:
      "Set two environment variables REDASH_BASE_URL (e.g. 'https://example.com') and REDASH_USER_API_KEY"
  };
}

export async function available(organization, user) {
  /// return an object with two keys: result: true/false
  /// these keys indicate if the ingest-contact-loader is usable
  /// Sometimes credentials need to be setup, etc.
  /// A second key expiresSeconds: should be how often this needs to be checked
  /// If this is instantaneous, you can have it be 0 (i.e. always), but if it takes time
  /// to e.g. verify credentials or test server availability,
  /// then it's better to allow the result to be cached
  const result =
    getConfig("REDASH_BASE_URL", organization) &&
    getConfig("REDASH_USER_API_KEY", organization);
  return {
    result,
    expiresSeconds: 0
  };
}

export function addServerEndpoints(expressApp) {
  /// If you need to create API endpoints for server-to-server communication
  /// this is where you would run e.g. app.post(....)
  /// Be mindful of security and make sure there's
  /// This is NOT where or how the client send or receive contact data
  return;
}

export function clientChoiceDataCacheKey(campaign, user) {
  /// returns a string to cache getClientChoiceData -- include items that relate to cacheability
  return "";
}

export async function getClientChoiceData(organization, campaign, user) {
  /// data to be sent to the admin client to present options to the component or similar
  /// The react-component will be sent this data as a property
  /// return a json object which will be cached for expiresSeconds long
  /// `data` should be a single string -- it can be JSON which you can parse in the client component
  return {
    data: getConfig("REDASH_BASE_URL", organization),
    expiresSeconds: 0
  };
}

let baseTlsEnabled = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
const tlsVerification = {
  avoid: yesAvoid => {
    if (yesAvoid) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
    }
  },
  restore: () => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = baseTlsEnabled;
  }
};

export async function downloadAndSaveResults(
  { queryId, resultId, job, redashUrl, organizationId },
  contextVars
) {
  const organization = cacheableData.organization.load(organizationId);
  const userApiKey = getConfig("REDASH_USER_API_KEY", organization);
  const baseUrl = getConfig("REDASH_BASE_URL", organization);
  const tlsVerifyOff = getConfig("REDASH_TLS_VERIFY_OFF", organization);

  console.log(
    "redash.downloadAndSaveResults",
    queryId,
    resultId,
    job.campaign_id,
    contextVars
  );
  // 3. Download result csv
  const resultsUrl = `${baseUrl}/api/queries/${queryId}/results/${resultId}.csv`;
  tlsVerification.avoid(tlsVerifyOff);
  const resultsDataResult = await httpRequest(resultsUrl, {
    method: "get",
    headers: { Authorization: `Key ${userApiKey}` },
    timeout: 900000 // 15 min
  });
  tlsVerification.restore();

  // 4. Parse CSV
  const { contacts, customFields, validationStats, error } = await new Promise(
    (resolve, reject) => {
      parseCSV(
        resultsDataResult.body,
        parseResults => {
          resolve(parseResults);
        },
        {
          headerTransformer: column =>
            column
              .replace("first_name", "firstName")
              .replace("last_name", "lastName")
        }
      );
    }
  );
  if (error) {
    await failedContactLoad(
      job,
      null,
      { redashUrl },
      { errors: [`CSV parse error: ${error}`] }
    );
    return;
  }

  await finalizeContactLoad(
    job,
    contacts,
    getConfig("MAX_CONTACTS", organization),
    { redashUrl },
    JSON.stringify({ finalCount: contacts.length, validationStats })
  );
}

export async function processContactLoad(job, maxContacts, organization) {
  /// Trigger processing -- this will likely be the most important part
  /// you should load contacts into the contact table with the job.campaign_id
  /// Since this might just *begin* the processing and other work might
  /// need to be completed asynchronously after this is completed (e.g. to distribute loads)
  /// After true contact-load completion, this (or another function)
  /// MUST call src/workers/jobs.js::completeContactLoad(job)
  ///   The async function completeContactLoad(job) will
  ///      * delete contacts that are in the opt_out table,
  ///      * delete duplicate cells,
  ///      * clear/update caching, etc.
  /// The organization parameter is an object containing the name and other
  ///   details about the organization on whose behalf this contact load
  ///   was initiated. It is included here so it can be passed as the
  ///   second parameter of getConfig in order to retrieve organization-
  ///   specific configuration values.
  /// Basic responsibilities:
  /// 1. Delete previous campaign contacts on a previous choice/upload
  /// 2. Set campaign_contact.campaign_id = job.campaign_id on all uploaded contacts
  /// 3. Set campaign_contact.message_status = "needsMessage" on all uploaded contacts
  /// 4. Ensure that campaign_contact.cell is in the standard phone format "+15551234567"
  ///    -- do NOT trust your backend to ensure this
  /// 5. If your source doesn't have timezone offset info already, then you need to
  ///    fill the campaign_contact.timezone_offset with getTimezoneByZip(contact.zip) (from "../../workers/jobs")
  /// Things to consider in your implementation:
  /// * Batching
  /// * Error handling
  /// * "Request of Doom" scenarios -- queries or jobs too big to complete

  const campaignId = job.campaign_id;
  const userApiKey = getConfig("REDASH_USER_API_KEY", organization);
  const baseUrl = getConfig("REDASH_BASE_URL", organization);
  const tlsVerifyOff = getConfig("REDASH_TLS_VERIFY_OFF", organization);
  const { redashUrl } = JSON.parse(job.payload);

  if (!userApiKey || !baseUrl) {
    await failedContactLoad(
      job,
      null,
      { redashUrl },
      { errors: ["misconfigured"] }
    );
    return;
  }
  if (!redashUrl) {
    await failedContactLoad(
      job,
      null,
      { redashUrl },
      { errors: ["submit with a query url"] }
    );
    return;
  }

  await r
    .knex("campaign_contact")
    .where("campaign_id", campaignId)
    .delete();

  // /queries/9009/source
  // e.g. https://foo.example.com/queries/9010/source?p_limit=20
  const matchUrl = redashUrl.match(/\/queries\/(\d+)[^?]*(\?.*)?/);
  let queryId = null;
  let params = "";
  if (matchUrl) {
    queryId = matchUrl[1];
    params = matchUrl[2] || "";
  } else {
    await failedContactLoad(
      job,
      null,
      { redashUrl },
      { errors: [`Unrecognized URL format. Should have /queries/<digits>...`] }
    );
    return;
  }
  // 1. start query
  const startQueryUrl = `${baseUrl}/api/queries/${queryId}/refresh${params}`;
  console.log("REDASH 1");
  tlsVerification.avoid(tlsVerifyOff);
  let refreshRedashResult;
  try {
    refreshRedashResult = await httpRequest(startQueryUrl, {
      method: "post",
      headers: { Authorization: `Key ${userApiKey}` }
    });
  } catch (err) {
    await failedContactLoad(
      job,
      null,
      { redashUrl },
      { errors: [`Failed to access Redash server. ${err.message}`] }
    );
    return;
  }
  tlsVerification.restore();
  console.log(
    "refreshRedashResult",
    refreshRedashResult,
    refreshRedashResult.status
  );
  if (refreshRedashResult.status != 200) {
    await failedContactLoad(
      job,
      null,
      { redashUrl },
      { errors: [`request error: ${refreshRedashResult.body}`] }
    );
    return;
  }
  const redashJobData = await refreshRedashResult.json();
  // 2. poll job status
  const jobQueryId = redashJobData.job.id;
  const redashPollStatusUrl = `${baseUrl}/api/jobs/${jobQueryId}`;
  console.log("REDASH 2", redashJobData);
  tlsVerification.avoid(tlsVerifyOff);
  const redashQueryCompleted = await httpRequest(redashPollStatusUrl, {
    method: "get",
    headers: { Authorization: `Key ${userApiKey}` },
    bodyRetryFunction: async res => {
      const json = await res.json();
      console.log("statusValidation", json);
      const jobStatus = json && json.job && json.job.status;
      return jobStatus === 3 || jobStatus === 4 ? json : { RETRY: 1 };
    },
    retries: 1000,
    timeout: 900000, // 15 min
    retryDelayMs: 3000 // 3 seconds
  });
  tlsVerification.restore();
  console.log("refreshDataResult", redashQueryCompleted);
  if (redashQueryCompleted.job.status === 4) {
    await failedContactLoad(
      job,
      null,
      { redashUrl },
      {
        errors: [
          `query failed id:${jobQueryId} ${redashQueryCompleted.job.error}`
        ]
      }
    );
    return;
  }
  const resultId = redashQueryCompleted.job.query_result_id;

  // 3. Download and upload result csv
  await jobRunner.dispatchTask(Tasks.EXTENSION_TASK, {
    method: "downloadAndSaveResults",
    path: "extensions/contact-loaders/redash",
    resultId,
    queryId,
    redashUrl,
    job,
    organizationId: organization.id
  });
}
