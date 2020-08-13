import {
  completeContactLoad,
  getTimezoneByZip,
  sendJobToAWSLambda
} from "../../../workers/jobs";
import {
  r,
  datawarehouse,
  CampaignContact,
  Campaign
} from "../../../server/models";
import { getConfig, hasConfig } from "../../../server/api/lib/config";
import { getFormattedPhoneNumber } from "../../../lib/phone-format.js";

let warehouseConnection = null;

export const name = "datawarehouse";

export function displayName() {
  return "Data Warehouse DB";
}

export function serverAdministratorInstructions() {
  return {
    description:
      "A way to send a query to a separate database where user data may be available",
    setupInstructions:
      "Set the environment variables for access to the warehouse database for a connection",
    environmentVariables: [
      "WAREHOUSE_DB_NAME",
      "WAREHOUSE_DB_USER",
      "WAREHOUSE_DB_PASSWORD",
      "WAREHOUSE_DB_HOST",
      "WAREHOUSE_DB_PORT",
      "WAREHOUSE_DB_TYPE",
      "WAREHOUSE_DB_LAMBDA_ITERATION"
    ]
  };
}

export async function available(organization, user) {
  /// return an object with two keys: result: true/false
  /// if the ingest-contact-loader is usable and has
  /// Sometimes credentials need to be setup, etc.
  /// A second key expiresSeconds: should be how often this needs to be checked
  /// If this is instantaneous, you can have it be 0 (i.e. always), but if it takes time
  /// to e.g. verify credentials or test server availability,
  /// then it's better to allow the result to be cached
  const result = user.is_superadmin && hasConfig("WAREHOUSE_DB_HOST");
  // FUTURE: maybe test connection and then have expiresSeconds caching
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

export function clientChoiceDataCacheKey(organization, campaign, user) {
  /// returns a string to cache getClientChoiceData -- include items that relate to cacheability
  return ""; // independent of org, campaign, and user since it's about availability
}

export async function getClientChoiceData(organization, campaign, user) {
  /// data to be sent to the admin client to present options to the component or similar
  /// The react-component will be sent this data as a property
  /// return a json object which will be cached for expiresSeconds long
  /// `data` should be a single string -- it can be JSON which you can parse in the client component
  let isConnected = false;
  let messages = [];
  try {
    warehouseConnection = warehouseConnection || datawarehouse();
    if (warehouseConnection) {
      const res = await warehouseConnection.raw("select 1 as result");
      if (res && res.rows && res.rows[0] && res.rows[0].result === 1) {
        isConnected = true;
      }
    } else {
      messages.push("no connection");
    }
  } catch (err) {
    console.error("warehouse connection error", err);
    isConnected = false;
    messages.push(err);
  }

  return {
    data: JSON.stringify({ isConnected, messages }),
    expiresSeconds: 3600 // an hour
  };
}

export async function processContactLoad(job, maxContacts, organization) {
  /// trigger processing -- this will likely be the most important part
  /// you should load contacts into the contact table with the job.campaign_id
  /// Since this might just *begin* the processing and other work might
  /// need to be completed asynchronously after this is completed (e.g. to distribute loads)
  /// AFTER true contact-load completion, this (or another function) MUST call
  /// src/workers/jobs.js::completeContactLoad(job)
  ///   The async function completeContactLoad(job) will delete opt-outs, delete duplicate cells, clear/update caching, etc.
  /// The organization parameter is an object containing the name and other
  ///   details about the organization on whose behalf this contact load
  ///   was initiated. It is included here so it can be passed as the
  ///   second parameter of getConfig in order to retrieve organization-
  ///   specific configuration values.
  /// Basic responsibilities:
  /// 1. delete previous campaign contacts on a previous choice/upload
  /// 2. set campaign_contact.campaign_id = job.campaign_id on all uploaded contacts
  /// 3. set campaign_contact.message_status = "needsMessage" on all uploaded contacts
  /// 4. Ensure that campaign_contact.cell is in the standard phone format "+15551234567"
  ///    -- do NOT trust your backend to ensure this
  /// Things to consider in your implementation:
  /// * Batching
  /// * Error handling
  /// * "Request of Doom" scenarios -- queries or jobs too big to complete
  const campaignId = job.campaign_id;
  let jobMessages;

  loadContactsFromDataWarehouse(job, maxContacts)
    .then(res => {
      console.log("datawarehouse: finished running", job.id, job.campaign_id);
    })
    .catch(err => {
      console.error(
        "datawarehouse: failed running",
        job.id,
        job.campaign_id,
        err
      );
    });
}

export async function loadContactsFromDataWarehouseFragment(job, jobEvent) {
  console.log(
    "starting loadContactsFromDataWarehouseFragment",
    jobEvent.campaignId,
    jobEvent.limit,
    jobEvent.offset,
    jobEvent
  );
  const insertOptions = {
    batchSize: 1000
  };
  const jobCompleted = await r
    .knex("job_request")
    .where("id", jobEvent.jobId)
    .select("status")
    .first();
  if (!jobCompleted) {
    console.log(
      "loadContactsFromDataWarehouseFragment job no longer exists",
      jobEvent.campaignId,
      jobCompleted,
      jobEvent
    );
    return { alreadyComplete: 1 };
  }

  let sqlQuery = jobEvent.query;
  if (jobEvent.limit) {
    sqlQuery += " LIMIT " + jobEvent.limit;
  }
  if (jobEvent.offset) {
    sqlQuery += " OFFSET " + jobEvent.offset;
  }
  let knexResult;
  try {
    warehouseConnection = warehouseConnection || datawarehouse();
    console.log(
      "loadContactsFromDataWarehouseFragment RUNNING WAREHOUSE query",
      sqlQuery
    );
    knexResult = await warehouseConnection.raw(sqlQuery);
  } catch (err) {
    // query failed
    console.error("Data warehouse query failed: ", err);
    jobMessages.push(`Data warehouse count query failed with ${err}`);
    // TODO: send feedback about job
  }
  const fields = {};
  const customFields = {};
  const contactFields = {
    first_name: 1,
    last_name: 1,
    cell: 1,
    zip: 1,
    external_id: 1
  };
  knexResult.fields.forEach(f => {
    fields[f.name] = 1;
    if (!(f.name in contactFields)) {
      customFields[f.name] = 1;
    }
  });
  if (!("first_name" in fields && "last_name" in fields && "cell" in fields)) {
    console.error(
      "SQL statement does not return first_name, last_name, and cell: ",
      sqlQuery,
      fields
    );
    jobMessages.push(
      `SQL statement does not return first_name, last_name and cell => ${sqlQuery} => with fields ${fields}`
    );
    return;
  }

  const savePortion = await Promise.all(
    knexResult.rows.map(async row => {
      const formatCell = getFormattedPhoneNumber(
        row.cell,
        process.env.PHONE_NUMBER_COUNTRY || "US"
      );
      const contact = {
        campaign_id: jobEvent.campaignId,
        first_name: row.first_name || "",
        last_name: row.last_name || "",
        cell: formatCell,
        zip: row.zip || "",
        external_id: row.external_id ? String(row.external_id) : "",
        assignment_id: null,
        message_status: "needsMessage"
      };
      const contactCustomFields = {};
      Object.keys(customFields).forEach(f => {
        contactCustomFields[f] = row[f];
      });
      contact.custom_fields = JSON.stringify(contactCustomFields);
      if (
        contact.zip &&
        !contactCustomFields.hasOwnProperty("timezone_offset")
      ) {
        contact.timezone_offset = await getTimezoneByZip(contact.zip);
      }
      if (contactCustomFields.hasOwnProperty("timezone_offset")) {
        contact.timezone_offset = contactCustomFields["timezone_offset"];
      }
      return contact;
    })
  );

  await CampaignContact.save(savePortion, insertOptions);
  await r
    .knex("job_request")
    .where("id", jobEvent.jobId)
    .increment("status", 1);
  const validationStats = {};
  const completed = await r
    .knex("job_request")
    .where("id", jobEvent.jobId)
    .select("status")
    .first();
  console.log(
    "loadContactsFromDataWarehouseFragment toward end",
    completed,
    jobEvent
  );

  if (!completed) {
    console.log(
      "loadContactsFromDataWarehouseFragment job has been deleted",
      completed,
      jobEvent.campaignId
    );
  } else if (jobEvent.totalParts && completed.status >= jobEvent.totalParts) {
    if (jobEvent.organizationId) {
      // now that we've saved them all, we delete everyone that is opted out locally
      // doing this in one go so that we can get the DB to do the indexed cell matching

      // delete invalid cells
      await r
        .knex("campaign_contact")
        .whereRaw("length(cell) != 12")
        .andWhere("campaign_id", jobEvent.campaignId)
        .delete()
        .then(result => {
          console.log(
            `loadContactsFromDataWarehouseFragment # of contacts with invalid cells removed from DW query (${jobEvent.campaignId}): ${result}`
          );
          validationStats.invalidCellCount = result;
        });
    }
    completeContactLoad(job);
    return { completed: 1, validationStats };
  } else if (jobEvent.part < jobEvent.totalParts - 1) {
    const newPart = jobEvent.part + 1;
    const newJob = {
      ...jobEvent,
      part: newPart,
      offset: newPart * jobEvent.step,
      limit: jobEvent.step,
      command: "loadContactsFromDataWarehouseFragmentJob"
    };
    if (process.env.WAREHOUSE_DB_LAMBDA_ITERATION) {
      console.log(
        "SENDING TO LAMBDA loadContactsFromDataWarehouseFragment",
        newJob
      );
      await sendJobToAWSLambda(newJob);
      return { invokedAgain: 1 };
    } else {
      return loadContactsFromDataWarehouseFragment(job, newJob);
    }
  }
}

export async function loadContactsFromDataWarehouse(job) {
  console.log("STARTING loadContactsFromDataWarehouse", job.payload);
  const jobMessages = [];
  const sqlQuery = JSON.parse(job.payload).contactSql;

  if (!sqlQuery.startsWith("SELECT") || sqlQuery.indexOf(";") >= 0) {
    console.error(
      "Malformed SQL statement.  Must begin with SELECT and not have any semicolons: ",
      sqlQuery
    );
    return;
  }
  if (!datawarehouse) {
    console.error("No data warehouse connection, so cannot load contacts", job);
    return;
  }

  let knexCountRes;
  let knexCount;
  try {
    warehouseConnection = warehouseConnection || datawarehouse();
    knexCountRes = await warehouseConnection.raw(
      `SELECT COUNT(*) FROM ( ${sqlQuery} ) AS QUERYCOUNT`
    );
  } catch (err) {
    console.error("Data warehouse count query failed: ", err);
    jobMessages.push(`Data warehouse count query failed with ${err}`);
  }

  if (knexCountRes) {
    knexCount = knexCountRes.rows[0].count;
    if (!knexCount || knexCount == 0) {
      jobMessages.push("Error: Data warehouse query returned zero results");
    }
  }

  const STEP =
    r.kninky && r.kninky.defaultsUnsupported
      ? 10 // sqlite has a max of 100 variables and ~8 or so are used per insert
      : 10000; // default
  const campaign = await Campaign.get(job.campaign_id);
  const totalParts = Math.ceil(knexCount / STEP);

  if (totalParts > 1 && /LIMIT/.test(sqlQuery)) {
    // We do naive string concatenation when we divide queries up for parts
    // just appending " LIMIT " and " OFFSET " arguments.
    // If there is already a LIMIT in the query then we'll be unable to do that
    // so we error out.  Note that if the total is < 10000, then LIMIT will be respected
    jobMessages.push(
      `Error: LIMIT in query not supported for results larger than ${STEP}. Count was ${knexCount}`
    );
  }

  if (job.id && jobMessages.length) {
    let resultMessages = await r
      .knex("job_request")
      .where("id", job.id)
      .update({ result_message: jobMessages.join("\n") });
    return resultMessages;
  }

  await r
    .knex("campaign_contact")
    .where("campaign_id", job.campaign_id)
    .delete();

  await loadContactsFromDataWarehouseFragment(job, {
    jobId: job.id,
    query: sqlQuery,
    campaignId: job.campaign_id,
    jobMessages,
    // beyond job object:
    organizationId: campaign.organization_id,
    totalParts,
    totalCount: knexCount,
    step: STEP,
    part: 0,
    limit: totalParts > 1 ? STEP : 0 // 0 is unlimited
  });
}
