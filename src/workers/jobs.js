import {
  r,
  datawarehouse,
  cacheableData,
  Assignment,
  Campaign,
  CampaignContact,
  Organization,
  User,
  UserOrganization
} from "../server/models";
import { log, gunzip, zipToTimeZone, convertOffsetsToStrings } from "../lib";
import { updateJob } from "./lib";
import { getFormattedPhoneNumber } from "../lib/phone-format.js";
import serviceMap from "../server/api/lib/services";
import {
  getLastMessage,
  saveNewIncomingMessage
} from "../server/api/lib/message-sending";
import importScriptFromDocument from "../server/api/lib/import-script.";

import AWS from "aws-sdk";
import Papa from "papaparse";
import moment from "moment";
import { sendEmail } from "../server/mail";
import { Notifications, sendUserNotification } from "../server/notifications";
import { unzip } from "zlib";

const defensivelyDeleteJob = async job => {
  if (job.id) {
    let retries = 0;
    const deleteJob = async () => {
      try {
        await r
          .table("job_request")
          .get(job.id)
          .delete();
      } catch (err) {
        if (retries < 5) {
          retries += 1;
          await deleteJob();
        } else log.error(`Could not delete job. Err: ${err.message}`);
      }
    };

    await deleteJob();
  } else log.debug(job);
};

const zipMemoization = {};
let warehouseConnection = null;
function optOutsByOrgId(orgId) {
  return r.knex
    .select("cell")
    .from("opt_out")
    .where("organization_id", orgId);
}

function optOutsByInstance() {
  return r.knex.select("cell").from("opt_out");
}

function getOptOutSubQuery(orgId) {
  return !!process.env.OPTOUTS_SHARE_ALL_ORGS
    ? optOutsByInstance()
    : optOutsByOrgId(orgId);
}

function optOutsByOrgId(orgId) {
  return r.knex
    .select("cell")
    .from("opt_out")
    .where("organization_id", orgId);
}

function optOutsByInstance() {
  return r.knex.select("cell").from("opt_out");
}

function getOptOutSubQuery(orgId) {
  return !!process.env.OPTOUTS_SHARE_ALL_ORGS
    ? optOutsByInstance()
    : optOutsByOrgId(orgId);
}

export async function getTimezoneByZip(zip) {
  if (zip in zipMemoization) {
    return zipMemoization[zip];
  }
  const rangeZip = zipToTimeZone(zip);
  if (rangeZip) {
    return `${rangeZip[2]}_${rangeZip[3]}`;
  }
  const zipDatum = await r.table("zip_code").get(zip);
  if (zipDatum && zipDatum.timezone_offset && zipDatum.has_dst) {
    zipMemoization[zip] = convertOffsetsToStrings([
      [zipDatum.timezone_offset, zipDatum.has_dst]
    ])[0];
    return zipMemoization[zip];
  }
  return "";
}

export async function sendJobToAWSLambda(job) {
  // job needs to be json-serializable
  // requires a 'command' key which should map to a function in job-processes.js
  console.log(
    "LAMBDA INVOCATION STARTING",
    job,
    process.env.AWS_LAMBDA_FUNCTION_NAME
  );

  if (!job.command) {
    console.log("LAMBDA INVOCATION FAILED: JOB NOT INVOKABLE", job);
    return Promise.reject("Job type not available in job-processes");
  }
  const lambda = new AWS.Lambda();
  const lambdaPayload = JSON.stringify(job);
  if (lambdaPayload.length > 128000) {
    console.log("LAMBDA INVOCATION FAILED PAYLOAD TOO LARGE");
    return Promise.reject("Payload too large");
  }

  const p = new Promise((resolve, reject) => {
    const result = lambda.invoke(
      {
        FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
        InvocationType: "Event",
        Payload: lambdaPayload
      },
      (err, data) => {
        if (err) {
          console.log("LAMBDA INVOCATION FAILED", err, job);
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
    console.log("LAMBDA INVOCATION RESULT", result);
  });
  return p;
}

export async function processSqsMessages() {
  // hit endpoint on SQS
  // ask for a list of messages from SQS (with quantity tied to it)
  // if SQS has messages, process messages into pending_message_part and dequeue messages (mark them as handled)
  // if SQS doesnt have messages, exit

  if (!process.env.TWILIO_SQS_QUEUE_URL) {
    return Promise.reject("TWILIO_SQS_QUEUE_URL not set");
  }

  const sqs = new AWS.SQS();

  const params = {
    QueueUrl: process.env.TWILIO_SQS_QUEUE_URL,
    AttributeNames: ["All"],
    MessageAttributeNames: ["string"],
    MaxNumberOfMessages: 10,
    VisibilityTimeout: 60,
    WaitTimeSeconds: 10,
    ReceiveRequestAttemptId: "string"
  };

  const p = new Promise((resolve, reject) => {
    sqs.receiveMessage(params, async (err, data) => {
      if (err) {
        console.log(err, err.stack);
        reject(err);
      } else if (data.Messages) {
        console.log(data);
        for (let i = 0; i < data.Messages.length; i++) {
          const message = data.Messages[i];
          const body = message.Body;
          console.log("processing sqs queue:", body);
          const twilioMessage = JSON.parse(body);

          await serviceMap.twilio.handleIncomingMessage(twilioMessage);

          sqs.deleteMessage(
            {
              QueueUrl: process.env.TWILIO_SQS_QUEUE_URL,
              ReceiptHandle: message.ReceiptHandle
            },
            (delMessageErr, delMessageData) => {
              if (delMessageErr) {
                console.log(delMessageErr, delMessageErr.stack); // an error occurred
              } else {
                console.log(delMessageData); // successful response
              }
            }
          );
        }
        resolve();
      }
    });
  });
  return p;
}

const unzipPayload = async job =>
  JSON.parse(await gunzip(Buffer.from(job.payload, "base64")));

export async function uploadContacts(job) {
  const campaignId = job.campaign_id;
  // We do this deletion in schema.js but we do it again here just in case the the queue broke and we had a backlog of contact uploads for one campaign
  const campaign = await Campaign.get(campaignId);
  const organization = await Organization.get(campaign.organization_id);
  const orgFeatures = JSON.parse(organization.features || "{}");

  const jobMessages = [];

  await r
    .table("campaign_contact")
    .getAll(campaignId, { index: "campaign_id" })
    .delete();
  const maxPercentage = 100;
  let contacts = await unzipPayload(job);
  const chunkSize = 1000;

  const maxContacts = parseInt(
    orgFeatures.hasOwnProperty("maxContacts")
      ? orgFeatures.maxContacts
      : process.env.MAX_CONTACTS || 0,
    10
  );

  if (maxContacts) {
    // note: maxContacts == 0 means no maximum
    contacts = contacts.slice(0, maxContacts);
  }

  const numChunks = Math.ceil(contacts.length / chunkSize);

  for (let index = 0; index < contacts.length; index++) {
    const datum = contacts[index];
    if (datum.zip) {
      // using memoization and large ranges of homogenous zips
      datum.timezone_offset = await getTimezoneByZip(datum.zip);
    }
  }

  for (let index = 0; index < numChunks; index++) {
    await updateJob(job, Math.round((maxPercentage / numChunks) * index));
    const savePortion = contacts.slice(
      index * chunkSize,
      (index + 1) * chunkSize
    );
    await CampaignContact.save(savePortion);
  }

  const optOutCellCount = await r
    .knex("campaign_contact")
    .whereIn("cell", function optouts() {
      this.select("cell")
        .from("opt_out")
        .where("organization_id", campaign.organization_id);
    });

  const deleteOptOutCells = await r
    .knex("campaign_contact")
    .whereIn("cell", getOptOutSubQuery(campaign.organization_id))
    .where("campaign_id", campaignId)
    .delete()
    .then(result => {
      console.log("deleted result: " + result);
    });

  if (deleteOptOutCells) {
    jobMessages.push(
      `Number of contacts excluded due to their opt-out status: ${optOutCellCount}`
    );
  }

  if (job.id) {
    if (jobMessages.length) {
      await r
        .knex("job_request")
        .where("id", job.id)
        .update({ result_message: jobMessages.join("\n") });
    } else {
      await r
        .table("job_request")
        .get(job.id)
        .delete();
    }
  }
  await cacheableData.campaign.reload(campaignId);
}

export async function loadContactsFromDataWarehouseFragment(jobEvent) {
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
    log.error("Data warehouse query failed: ", err);
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
    log.error(
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
        contact.timezone_offset = getTimezoneByZip(contact.zip);
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

      // delete optout cells
      await r
        .knex("campaign_contact")
        .whereIn("cell", getOptOutSubQuery(jobEvent.organizationId))
        .where("campaign_id", jobEvent.campaignId)
        .delete()
        .then(result => {
          console.log(
            `loadContactsFromDataWarehouseFragment # of contacts opted out removed from DW query (${jobEvent.campaignId}): ${result}`
          );
          validationStats.optOutCount = result;
        });

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

      // delete duplicate cells
      await r
        .knex("campaign_contact")
        .whereIn(
          "id",
          r
            .knex("campaign_contact")
            .select("campaign_contact.id")
            .leftJoin("campaign_contact AS c2", function joinSelf() {
              this.on("c2.campaign_id", "=", "campaign_contact.campaign_id")
                .andOn("c2.cell", "=", "campaign_contact.cell")
                .andOn("c2.id", ">", "campaign_contact.id");
            })
            .where("campaign_contact.campaign_id", jobEvent.campaignId)
            .whereNotNull("c2.id")
        )
        .delete()
        .then(result => {
          console.log(
            `loadContactsFromDataWarehouseFragment # of contacts with duplicate cells removed from DW query (${jobEvent.campaignId}): ${result}`
          );
          validationStats.duplicateCellCount = result;
        });
    }
    await r
      .table("job_request")
      .get(jobEvent.jobId)
      .delete();
    await cacheableData.campaign.reload(jobEvent.campaignId);
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
      return loadContactsFromDataWarehouseFragment(newJob);
    }
  }
}

export async function loadContactsFromDataWarehouse(job) {
  console.log("STARTING loadContactsFromDataWarehouse", job.payload);
  const jobMessages = [];
  const sqlQuery = job.payload;

  if (!sqlQuery.startsWith("SELECT") || sqlQuery.indexOf(";") >= 0) {
    log.error(
      "Malformed SQL statement.  Must begin with SELECT and not have any semicolons: ",
      sqlQuery
    );
    return;
  }
  if (!datawarehouse) {
    log.error("No data warehouse connection, so cannot load contacts", job);
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
    log.error("Data warehouse count query failed: ", err);
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

  await loadContactsFromDataWarehouseFragment({
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

export async function assignTexters(job) {
  // Assigns UNassigned campaign contacts to texters
  // It does NOT re-assign contacts to other texters
  // STEPS:
  // 1. get currentAssignments = all current assignments
  //       .needsMessageCount = contacts that haven't been contacted yet
  // 2. changedAssignments = assignments where texter was removed or needsMessageCount different
  //                  needsMessageCount differ possibilities:
  //                  a. they started texting folks, so needsMessageCount is less
  //                  b. they were assigned a different number by the admin
  // 3. update changed assignments (temporarily) not to be in needsMessage status
  // 4. availableContacts: count of contacts without an assignment
  // 5. forEach texter:
  //        * skip if 'unchanged'
  //        * if new texter, create assignment record
  //        * update X needsMessage campaign_contacts with texter's assignment record
  //             (min of needsMessageCount,availableContacts)
  // 6. delete assignments with a 0 assignment count
  // SCENARIOS:
  // * deleted texter:
  //   ends up in currentAssignments and changedAssignments
  //   marked as demoted texter, so all contacts are set assignment_id=null
  // * texter with fewer count:
  //   ends up in currentAssignments and changedAssignments
  //   marked as demoted texter: all current contacts are removed
  //   iterating over texter, the currentAssignment re-assigns needsMessageCount more texters
  // * new texter
  //   no current/changed assignment
  //   iterating over texter, assignment is created, then apportioned needsMessageCount texters

  /*
  A. clientMessagedCount  or serverMessagedCount: # of contacts assigned and already texted (for a texter)
    aka clientMessagedCount / serverMessagedCount
  B. needsMessageCount: # of contacts assigned but not yet texted (for a texter)
  C. max contacts (for a texter)
  D. pool of unassigned and assignable texters
    aka availableContacts

  In dynamic assignment mode:
    Add new texter
      Create assignment
    Change C
      if new C >= A and new C <> old C:
        Update assignment
      if new C >= A and new C = old C:
        No change
      if new C < A or new C = 0:
        Why are we doing this? If we want to keep someone from texting any more,
          we set their max_contacts to 0, and manually re-assign any of their
          previously texted contacts in the Message Review admin.
          TODO: Form validation should catch the case where C < A.
    Delete texter
      Assignment form currently prevents this (though it might be okay if A = 0).
      To stop a texter from texting any more in the campaign,
      set their max to zero and re-assign their contacts to another texter.

  In standard assignment mode:
    Add new texter
      Create assignment
      Assign B contacts
    Change B
      if new B > old B:
        Update assignment
        Assign (new B - old B) contacts
      if new B = old B:
        No change
      if new B < old B:
        Update assignment
        Unassign (old B - new B) untexted contacts
      if new B = 0:
        Update assignment
    Delete texter
      Not sure we allow this?

  TODO: what happens when we switch modes? Do we allow it?
  */
  const payload = JSON.parse(job.payload);
  const cid = job.campaign_id;
  const campaign = (await r.knex("campaign").where({ id: cid }))[0];
  const texters = payload.texters;
  const currentAssignments = await r
    .knex("assignment")
    .where("assignment.campaign_id", cid)
    .joinRaw(
      "left join campaign_contact allcontacts" +
        " ON (allcontacts.assignment_id = assignment.id)"
    )
    .groupBy("user_id", "assignment.id")
    .select(
      "user_id",
      "assignment.id as id",
      r.knex.raw(
        "SUM(CASE WHEN allcontacts.message_status = 'needsMessage' THEN 1 ELSE 0 END) as needs_message_count"
      ),
      r.knex.raw("COUNT(allcontacts.id) as full_contact_count"),
      "max_contacts"
    )
    .catch(log.error);

  const unchangedTexters = {}; // max_contacts and needsMessageCount unchanged
  const demotedTexters = {}; // needsMessageCount reduced
  const dynamic = campaign.use_dynamic_assignment;
  // detect changed assignments
  currentAssignments
    .map(assignment => {
      const texter = texters.filter(
        texter => parseInt(texter.id, 10) === assignment.user_id
      )[0];
      if (texter) {
        const unchangedMaxContacts =
          parseInt(texter.maxContacts, 10) === assignment.max_contacts || // integer = integer
          texter.maxContacts === assignment.max_contacts; // null = null
        const unchangedNeedsMessageCount =
          texter.needsMessageCount ===
          parseInt(assignment.needs_message_count, 10);
        if (
          (!dynamic && unchangedNeedsMessageCount) ||
          (dynamic && unchangedMaxContacts)
        ) {
          unchangedTexters[assignment.user_id] = true;
          return null;
        } else if (!dynamic) {
          // standard assignment change
          // If there is a delta between client and server, then accommodate delta (See #322)
          const clientMessagedCount =
            texter.contactsCount - texter.needsMessageCount;
          const serverMessagedCount =
            assignment.full_contact_count - assignment.needs_message_count;

          const numDifferent =
            (texter.needsMessageCount || 0) -
            assignment.needs_message_count -
            Math.max(0, serverMessagedCount - clientMessagedCount);

          if (numDifferent < 0) {
            // got less than before
            demotedTexters[assignment.id] = -numDifferent;
          } else {
            // got more than before: assign the difference
            texter.needsMessageCount = numDifferent;
          }
        }
        return assignment;
      } else {
        // deleted texter
        demotedTexters[assignment.id] = assignment.needs_message_count;
        return assignment;
      }
    })
    .filter(ele => ele !== null);

  for (const assignId in demotedTexters) {
    // Here we unassign ALL the demotedTexters contacts (not just the demotion count)
    // because they will get reapportioned below
    await r
      .knex("campaign_contact")
      .where(
        "id",
        "in",
        r
          .knex("campaign_contact")
          .where("assignment_id", assignId)
          .where("message_status", "needsMessage")
          .select("id")
      )
      .update({ assignment_id: null })
      .catch(log.error);
  }

  await updateJob(job, 20);

  let availableContacts = await r
    .table("campaign_contact")
    .getAll(null, { index: "assignment_id" })
    .filter({ campaign_id: cid })
    .count();
  // Go through all the submitted texters and create assignments
  const texterCount = texters.length;

  for (let index = 0; index < texterCount; index++) {
    const texter = texters[index];
    const texterId = parseInt(texter.id, 10);
    let maxContacts = null; // no limit

    if (texter.maxContacts || texter.maxContacts === 0) {
      maxContacts = Math.min(
        parseInt(texter.maxContacts, 10),
        parseInt(process.env.MAX_CONTACTS_PER_TEXTER || texter.maxContacts, 10)
      );
    } else if (process.env.MAX_CONTACTS_PER_TEXTER) {
      maxContacts = parseInt(process.env.MAX_CONTACTS_PER_TEXTER, 10);
    }

    if (unchangedTexters[texterId]) {
      continue;
    }

    const contactsToAssign = Math.min(
      availableContacts,
      texter.needsMessageCount
    );

    if (contactsToAssign === 0) {
      // avoid creating a new assignment when the texter should get 0
      if (!campaign.use_dynamic_assignment) {
        continue;
      }
    }
    availableContacts = availableContacts - contactsToAssign;
    const existingAssignment = currentAssignments.find(
      ele => ele.user_id === texterId
    );
    let assignment = null;
    if (existingAssignment) {
      if (!dynamic) {
        assignment = new Assignment({
          id: existingAssignment.id,
          user_id: existingAssignment.user_id,
          campaign_id: cid
        }); // for notification
      } else {
        await r
          .knex("assignment")
          .where({ id: existingAssignment.id })
          .update({ max_contacts: maxContacts });
      }
    } else {
      assignment = await new Assignment({
        user_id: texterId,
        campaign_id: cid,
        max_contacts: maxContacts
      }).save();
    }

    if (!campaign.use_dynamic_assignment) {
      await r
        .knex("campaign_contact")
        .where(
          "id",
          "in",
          r
            .knex("campaign_contact")
            .where({ assignment_id: null, campaign_id: cid })
            .limit(contactsToAssign)
            .select("id")
        )
        .update({
          assignment_id: assignment.id
        })
        .catch(log.error);

      if (existingAssignment) {
        // We can't rely on an observer because nothing
        // about the actual assignment object changes
        await sendUserNotification({
          type: Notifications.ASSIGNMENT_UPDATED,
          assignment
        });
      }
    }

    await updateJob(job, Math.floor((75 / texterCount) * (index + 1)) + 20);
  } // endfor

  if (!campaign.use_dynamic_assignment) {
    // dynamic assignments, having zero initially is ok
    const assignmentsToDelete = r
      .knex("assignment")
      .where("assignment.campaign_id", cid)
      .leftJoin(
        "campaign_contact",
        "assignment.id",
        "campaign_contact.assignment_id"
      )
      .groupBy("assignment.id")
      .havingRaw("COUNT(campaign_contact.id) = 0")
      .select("assignment.id as id");

    await r
      .knex("assignment")
      .where("id", "in", assignmentsToDelete)
      .delete()
      .catch(log.error);
  }

  if (job.id) {
    await r
      .table("job_request")
      .get(job.id)
      .delete();
  }
}

export async function exportCampaign(job) {
  const payload = JSON.parse(job.payload);
  const id = job.campaign_id;
  const campaign = await Campaign.get(id);
  const requester = payload.requester;
  const user = await User.get(requester);
  const allQuestions = {};
  const questionCount = {};
  const interactionSteps = await r
    .table("interaction_step")
    .getAll(id, { index: "campaign_id" });

  interactionSteps.forEach(step => {
    if (!step.question || step.question.trim() === "") {
      return;
    }

    if (questionCount.hasOwnProperty(step.question)) {
      questionCount[step.question] += 1;
    } else {
      questionCount[step.question] = 0;
    }
    const currentCount = questionCount[step.question];
    if (currentCount > 0) {
      allQuestions[step.id] = `${step.question}_${currentCount}`;
    } else {
      allQuestions[step.id] = step.question;
    }
  });

  let finalCampaignResults = [];
  let finalCampaignMessages = [];
  const assignments = await r
    .knex("assignment")
    .where("campaign_id", id)
    .join("user", "user_id", "user.id")
    .select(
      "assignment.id as id",
      // user fields
      "first_name",
      "last_name",
      "email",
      "cell",
      "assigned_cell"
    );
  const assignmentCount = assignments.length;

  for (let index = 0; index < assignmentCount; index++) {
    const assignment = assignments[index];
    const optOuts = await r
      .table("opt_out")
      .getAll(assignment.id, { index: "assignment_id" });

    const contacts = await r
      .knex("campaign_contact")
      .leftJoin("zip_code", "zip_code.zip", "campaign_contact.zip")
      .select()
      .where("assignment_id", assignment.id);
    const messages = await r
      .table("message")
      .getAll(assignment.id, { index: "assignment_id" });
    let convertedMessages = messages.map(message => {
      const messageRow = {
        assignmentId: message.assignment_id,
        campaignId: campaign.id,
        userNumber: message.user_number,
        contactNumber: message.contact_number,
        isFromContact: message.is_from_contact,
        sendStatus: message.send_status,
        attemptedAt: moment(message.created_at).toISOString(),
        text: message.text
      };
      return messageRow;
    });

    convertedMessages = await Promise.all(convertedMessages);
    finalCampaignMessages = finalCampaignMessages.concat(convertedMessages);
    let convertedContacts = contacts.map(async contact => {
      const contactRow = {
        campaignId: campaign.id,
        campaign: campaign.title,
        assignmentId: assignment.id,
        "texter[firstName]": assignment.first_name,
        "texter[lastName]": assignment.last_name,
        "texter[email]": assignment.email,
        "texter[cell]": assignment.cell,
        "texter[assignedCell]": assignment.assigned_cell,
        "contact[firstName]": contact.first_name,
        "contact[lastName]": contact.last_name,
        "contact[cell]": contact.cell,
        "contact[zip]": contact.zip,
        "contact[city]": contact.city ? contact.city : null,
        "contact[state]": contact.state ? contact.state : null,
        "contact[optOut]": optOuts.find(ele => ele.cell === contact.cell)
          ? "true"
          : "false",
        "contact[messageStatus]": contact.message_status,
        "contact[external_id]": contact.external_id
      };
      const customFields = JSON.parse(contact.custom_fields);
      Object.keys(customFields).forEach(fieldName => {
        contactRow[`contact[${fieldName}]`] = customFields[fieldName];
      });

      const questionResponses = await r
        .table("question_response")
        .getAll(contact.id, { index: "campaign_contact_id" });

      Object.keys(allQuestions).forEach(stepId => {
        let value = "";
        questionResponses.forEach(response => {
          if (response.interaction_step_id === parseInt(stepId, 10)) {
            value = response.value;
          }
        });

        contactRow[`question[${allQuestions[stepId]}]`] = value;
      });

      return contactRow;
    });
    convertedContacts = await Promise.all(convertedContacts);
    finalCampaignResults = finalCampaignResults.concat(convertedContacts);
    await updateJob(job, Math.round((index / assignmentCount) * 100));
  }
  const campaignCsv = Papa.unparse(finalCampaignResults);
  const messageCsv = Papa.unparse(finalCampaignMessages);

  if (
    process.env.AWS_ACCESS_AVAILABLE ||
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  ) {
    try {
      const s3bucket = new AWS.S3({
        params: { Bucket: process.env.AWS_S3_BUCKET_NAME }
      });
      const campaignTitle = campaign.title
        .replace(/ /g, "_")
        .replace(/\//g, "_");
      const key = `${campaignTitle}-${moment().format(
        "YYYY-MM-DD-HH-mm-ss"
      )}.csv`;
      const messageKey = `${key}-messages.csv`;
      let params = { Key: key, Body: campaignCsv };
      await s3bucket.putObject(params).promise();
      params = { Key: key, Expires: 86400 };
      const campaignExportUrl = await s3bucket.getSignedUrl(
        "getObject",
        params
      );
      params = { Key: messageKey, Body: messageCsv };
      await s3bucket.putObject(params).promise();
      params = { Key: messageKey, Expires: 86400 };
      const campaignMessagesExportUrl = await s3bucket.getSignedUrl(
        "getObject",
        params
      );
      await sendEmail({
        to: user.email,
        subject: `Export ready for ${campaign.title}`,
        text: `Your Spoke exports are ready! These URLs will be valid for 24 hours.
        Campaign export: ${campaignExportUrl}
        Message export: ${campaignMessagesExportUrl}`
      }).catch(err => {
        log.error(err);
        log.info(`Campaign Export URL - ${campaignExportUrl}`);
        log.info(`Campaign Messages Export URL - ${campaignMessagesExportUrl}`);
      });
      log.info(`Successfully exported ${id}`);
    } catch (err) {
      log.error(err);
      await sendEmail({
        to: user.email,
        subject: `Export failed for ${campaign.title}`,
        text: `Your Spoke exports failed... please try again later.
        Error: ${err.message}`
      });
    }
  } else {
    log.debug("Would have saved the following to S3:");
    log.debug(campaignCsv);
    log.debug(messageCsv);
  }

  await defensivelyDeleteJob(job);
}
export async function importScript(job) {
  const payload = await unzipPayload(job);
  try {
    await importScriptFromDocument(payload.campaignId, payload.url); // TODO try/catch
  } catch (exception) {
    await r
      .knex("job_request")
      .where("id", job.id)
      .update({ result_message: exception.message });
    console.log(exception.message);
    return;
  }
  defensivelyDeleteJob(job);
}

// add an in-memory guard that the same messages are being sent again and again
// not related to stale filter
let pastMessages = [];

export async function sendMessages(queryFunc, defaultStatus) {
  try {
    await knex.transaction(async trx => {
      let messages = [];
      try {
        let messageQuery = r
          .knex("message")
          .transacting(trx)
          .forUpdate()
          .where({ send_status: defaultStatus || "QUEUED" });

        if (queryFunc) {
          messageQuery = queryFunc(messageQuery);
        }

        messages = await messageQuery.orderBy("created_at");
      } catch (err) {
        // Unable to obtain lock on these rows meaning another process must be
        // sending them. We will exit gracefully in that case.
        trx.rollback();
        return;
      }

      try {
        for (let index = 0; index < messages.length; index++) {
          let message = messages[index];
          if (pastMessages.indexOf(message.id) !== -1) {
            throw new Error(
              "Encountered send message request of the same message." +
                " This is scary!  If ok, just restart process. Message ID: " +
                message.id
            );
          }
          message.service = message.service || process.env.DEFAULT_SERVICE;
          const service = serviceMap[message.service];
          log.info(
            `Sending (${message.service}): ${message.user_number} -> ${message.contact_number}\nMessage: ${message.text}`
          );
          await service.sendMessage(message, null, trx);
          pastMessages.push(message.id);
          pastMessages = pastMessages.slice(-100); // keep the last 100
        }

        trx.commit();
      } catch (err) {
        console.log("error sending messages:");
        console.error(err);
        trx.rollback();
      }
    });
  } catch (err) {
    console.log("sendMessages transaction errored:");
    console.error(err);
  }
}

export async function handleIncomingMessageParts() {
  const messageParts = await r.table("pending_message_part").limit(100);
  const messagePartsByService = {};
  messageParts.forEach(m => {
    if (m.service in serviceMap) {
      if (!(m.service in messagePartsByService)) {
        messagePartsByService[m.service] = [];
      }
      messagePartsByService[m.service].push(m);
    }
  });
  for (const serviceKey in messagePartsByService) {
    let allParts = messagePartsByService[serviceKey];
    const service = serviceMap[serviceKey];
    if (service.syncMessagePartProcessing) {
      // filter for anything older than ten minutes ago
      const tenMinutesAgo = new Date(new Date() - 1000 * 60 * 10);
      allParts = allParts.filter(part => part.created_at < tenMinutesAgo);
    }
    const allPartsCount = allParts.length;
    if (allPartsCount === 0) {
      continue;
    }

    const convertMessageParts = service.convertMessagePartsToMessage;
    const messagesToSave = [];
    let messagePartsToDelete = [];
    const concatMessageParts = {};
    for (let i = 0; i < allPartsCount; i++) {
      const part = allParts[i];
      const serviceMessageId = part.service_id;
      const savedCount = await r
        .table("message")
        .getAll(serviceMessageId, { index: "service_id" })
        .count();
      const lastMessage = await getLastMessage({
        contactNumber: part.contact_number,
        service: serviceKey
      });
      const duplicateMessageToSaveExists = !!messagesToSave.find(
        message => message.service_id === serviceMessageId
      );
      if (!lastMessage) {
        log.info("Received message part with no thread to attach to", part);
        messagePartsToDelete.push(part);
      } else if (savedCount > 0) {
        log.info(
          `Found already saved message matching part service message ID ${part.service_id}`
        );
        messagePartsToDelete.push(part);
      } else if (duplicateMessageToSaveExists) {
        log.info(
          `Found duplicate message to be saved matching part service message ID ${part.service_id}`
        );
        messagePartsToDelete.push(part);
      } else {
        const parentId = part.parent_id;
        if (!parentId) {
          messagesToSave.push(await convertMessageParts([part]));
          messagePartsToDelete.push(part);
        } else {
          if (part.service !== "nexmo") {
            throw new Error("should not have a parent ID for twilio");
          }
          const groupKey = [parentId, part.contact_number, part.user_number];
          const serviceMessage = JSON.parse(part.service_message);
          if (!concatMessageParts.hasOwnProperty(groupKey)) {
            const partCount = parseInt(serviceMessage["concat-total"], 10);
            concatMessageParts[groupKey] = Array(partCount).fill(null);
          }

          const partIndex = parseInt(serviceMessage["concat-part"], 10) - 1;
          if (concatMessageParts[groupKey][partIndex] !== null) {
            messagePartsToDelete.push(part);
          } else {
            concatMessageParts[groupKey][partIndex] = part;
          }
        }
      }
    }
    const keys = Object.keys(concatMessageParts);
    const keyCount = keys.length;

    for (let i = 0; i < keyCount; i++) {
      const groupKey = keys[i];
      const messageParts = concatMessageParts[groupKey];

      if (messageParts.filter(part => part === null).length === 0) {
        messagePartsToDelete = messagePartsToDelete.concat(messageParts);
        const message = await convertMessageParts(messageParts);
        messagesToSave.push(message);
      }
    }

    const messageCount = messagesToSave.length;
    for (let i = 0; i < messageCount; i++) {
      log.info(
        "Saving message with service message ID",
        messagesToSave[i].service_id
      );
      await saveNewIncomingMessage(messagesToSave[i]);
    }

    const messageIdsToDelete = messagePartsToDelete.map(m => m.id);
    log.info("Deleting message parts", messageIdsToDelete);
    await r
      .table("pending_message_part")
      .getAll(...messageIdsToDelete)
      .delete();
  }
}

// Temporary fix for orgless users
// See https://github.com/MoveOnOrg/Spoke/issues/934
// and job-processes.js
export async function fixOrgless() {
  if (process.env.FIX_ORGLESS) {
    const orgless = await r.knex
      .select("user.id")
      .from("user")
      .leftJoin("user_organization", "user.id", "user_organization.user_id")
      .whereNull("user_organization.id");
    orgless.forEach(async orglessUser => {
      await UserOrganization.save({
        user_id: orglessUser.id.toString(),
        organization_id: process.env.DEFAULT_ORG || 1,
        role: "TEXTER"
      }).error(function(error) {
        // Unexpected errors
        console.log("error on userOrganization save in orgless", error);
      });
      console.log(
        "added orgless user " +
          user.id +
          " to organization " +
          process.env.DEFAULT_ORG
      );
    }); // forEach
  } // if
} // function

export async function clearOldJobs(delay) {
  // to clear out old stuck jobs
  const twoHoursAgo = new Date(new Date() - 1000 * 60 * 60 * 2);
  delay = delay || twoHoursAgo;
  return await r
    .knex("job_request")
    .where({ assigned: true })
    .where("updated_at", "<", delay)
    .delete();
}
