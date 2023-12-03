import {
  r,
  cacheableData,
  Assignment,
  Campaign,
  Organization,
  User,
  UserOrganization
} from "../server/models";
import telemetry from "../server/telemetry";
import { log, gunzip, zipToTimeZone, convertOffsetsToStrings } from "../lib";
import { sleep, updateJob } from "./lib";
import {
  getServiceFromOrganization,
  getService
} from "../extensions/service-vendors";
import twilio from "../extensions/service-vendors/twilio";
import {
  getLastMessage,
  saveNewIncomingMessage
} from "../extensions/service-vendors/message-sending";
import {
  serviceManagersHaveImplementation,
  processServiceManagers
} from "../extensions/service-managers";
import importScriptFromDocument from "../server/api/lib/import-script";
import { rawIngestMethod } from "../extensions/contact-loaders";

import { Lambda } from "@aws-sdk/client-lambda";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, S3 } from "@aws-sdk/client-s3";
import { SQS } from "@aws-sdk/client-sqs";
import Papa from "papaparse";
import moment from "moment";
import { sendEmail } from "../server/mail";
import { Notifications, sendUserNotification } from "../server/notifications";
import { getConfig } from "../server/api/lib/config";
import { invokeTaskFunction, Tasks } from "./tasks";
import { jobRunner } from "../extensions/job-runners";

import fs from "fs";
import path from "path";

const defensivelyDeleteOldJobsForCampaignJobType = async job => {
  console.log("job", job);
  let retries = 0;
  const doDelete = async () => {
    try {
      await r
        .knex("job_request")
        .where({ campaign_id: job.campaign_id, job_type: job.job_type })
        .whereNot({ id: job.id })
        .delete();
    } catch (err) {
      if (retries < 5) {
        retries += 1;
        await doDelete();
      } else
        console.error(`Could not delete campaign/jobType. Err: ${err.message}`);
    }
  };

  await doDelete();
};

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
        } else console.error(`Could not delete job. Err: ${err.message}`);
      }
    };

    await deleteJob();
  } else log.debug(job);
};

const zipMemoization = {};

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
  const lambda = new Lambda();
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

export async function processSqsMessages(TWILIO_SQS_QUEUE_URL) {
  // hit endpoint on SQS
  // ask for a list of messages from SQS (with quantity tied to it)
  // if SQS has messages, process messages into pending_message_part and dequeue messages (mark them as handled)
  // if SQS doesnt have messages, exit

  if (!TWILIO_SQS_QUEUE_URL) {
    return Promise.reject("TWILIO_SQS_QUEUE_URL not set");
  }

  const sqs = new SQS();

  const params = {
    QueueUrl: TWILIO_SQS_QUEUE_URL,
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
        console.log("processSqsMessages Error", err, err.stack);
        reject(err);
      } else {
        if (!data.Messages || !data.Messages.length) {
          // Since we are likely in a while(true) loop let's avoid racing
          await sleep(10000);
          resolve();
        } else {
          console.log("processSqsMessages", data.Messages.length);
          for (let i = 0; i < data.Messages.length; i++) {
            const message = data.Messages[i];
            const body = message.Body;
            if (process.env.DEBUG) {
              console.log("processSqsMessages message body", body);
            }
            const twilioMessage = JSON.parse(body);
            await getService("twilio").handleIncomingMessage(twilioMessage);
            const delMessageData = await sqs
              .deleteMessage({
                QueueUrl: TWILIO_SQS_QUEUE_URL,
                ReceiptHandle: message.ReceiptHandle
              })
              .catch(reject);
            if (process.env.DEBUG) {
              console.log("processSqsMessages deleteresult", delMessageData);
            }
          }
          resolve();
        }
      }
    });
  });
  return p;
}

export async function dispatchContactIngestLoad(job, organization) {
  if (!organization) {
    const campaign = await Campaign.get(job.campaign_id);
    organization = await Organization.get(campaign.organization_id);
  }
  const ingestMethod = rawIngestMethod(job.job_type.replace("ingest.", ""));
  if (!ingestMethod) {
    console.error(
      "dispatchContactIngestLoad not found. invalid job type",
      job.job_type
    );
    return;
  }
  const orgFeatures = JSON.parse(organization.features || "{}");
  const maxContacts = parseInt(
    orgFeatures.hasOwnProperty("maxContacts")
      ? orgFeatures.maxContacts
      : process.env.MAX_CONTACTS || 0,
    10
  );
  await ingestMethod.processContactLoad(job, maxContacts, organization);
}

export async function failedContactLoad(
  job,
  _,
  ingestDataReference,
  ingestResult
) {
  const campaignId = job.campaign_id;
  const finalContactCount = await r.getCount(
    r.knex("campaign_contact").where("campaign_id", campaignId)
  );

  await r
    .knex("campaign_admin")
    .where("campaign_id", campaignId)
    .update({
      deleted_optouts_count: null,
      duplicate_contacts_count: null,
      contacts_count: finalContactCount,
      ingest_method: job.job_type.replace(/^ingest./, ""),
      ingest_success: false,
      ingest_result: ingestResult || null,
      ingest_data_reference: ingestDataReference || null
    });
  if (job.id) {
    await r
      .knex("job_request")
      .where("id", job.id)
      .delete();
  }
  await telemetry.reportEvent("Contact Load Failure", {
    count: finalContactCount,
    jobId: job.id,
    campaignId,
    ingestResult
  });
}

export async function completeContactLoad(
  job,
  _,
  ingestDataReference,
  ingestResult
) {
  const campaignId = job.campaign_id;
  const campaign = await cacheableData.campaign.load(campaignId);
  const organization = await Organization.get(campaign.organization_id);

  let deleteOptOutCells = null;
  let deleteDuplicateCells = null;
  console.log("completeContactLoad", campaignId, job.id);
  const knexOptOutDeleteResult = await r
    .knex("campaign_contact")
    .whereIn("cell", getOptOutSubQuery(campaign.organization_id))
    .where("campaign_id", campaignId)
    .delete()
    .then(result => {
      deleteOptOutCells = result;
      console.log("Deleted opt-outs: " + deleteOptOutCells);
    })
    .catch(err => {
      console.log("Error deleting opt-outs:", campaignId, err);
    });

  // delete duplicate cells (last wins)
  await r
    .knex("campaign_contact")
    .whereNotIn(
      "id",
      r
        .knex("campaign_contact")
        .select(r.knex.raw("max(id) as id"))
        .where("campaign_id", campaignId)
        .groupBy("cell")
    )
    .where("campaign_contact.campaign_id", campaignId)
    .delete()
    .then(result => {
      deleteDuplicateCells = result;
      console.log("Deduplication result", campaignId, result);
    })
    .catch(err => {
      deleteDuplicateCells = -1;
      console.error("Failed deduplication", campaignId, err);
    });

  const finalContactCount = await r.getCount(
    r.knex("campaign_contact").where("campaign_id", campaignId)
  );

  await r
    .knex("campaign_admin")
    .where("campaign_id", campaignId)
    .update({
      deleted_optouts_count: deleteOptOutCells,
      duplicate_contacts_count: deleteDuplicateCells,
      contacts_count: finalContactCount,
      ingest_method: job.job_type.replace(/^ingest./, ""),
      ingest_success: true,
      ingest_result: ingestResult || null,
      ingest_data_reference: ingestDataReference || null
    });
  if (job.id) {
    await r
      .knex("job_request")
      .where("id", job.id)
      .delete();
  }
  await cacheableData.campaign.reload(campaignId);
  await telemetry.reportEvent("Contact Load", {
    count: finalContactCount,
    jobId: job.id,
    campaignId,
    deleteOptOutCells,
    deleteDuplicateCells,
    ingestResult
  });

  if (
    serviceManagersHaveImplementation("onCampaignContactLoad", organization)
  ) {
    await invokeTaskFunction(Tasks.SERVICE_MANAGER_TRIGGER, {
      functionName: "onCampaignContactLoad",
      organizationId: organization.id,
      data: {
        campaign,
        ingestResult,
        ingestDataReference,
        finalContactCount,
        deleteOptOutCells
      }
    });
  }
  console.log(
    "completeContactLoad completed",
    campaignId,
    job.id,
    finalContactCount,
    deleteOptOutCells,
    deleteDuplicateCells
  );
}

export async function unzipPayload(job) {
  return JSON.parse(await gunzip(Buffer.from(job.payload, "base64")));
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
  console.log("assignTexters1", cid, payload);
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
        cacheableData.assignment.clear(existingAssignment.id);
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

  if (campaign.is_started) {
    console.log("assignTexterscache1", job.campaign_id);
    await cacheableData.campaignContact.updateCampaignAssignmentCache(
      job.campaign_id
    );
  }

  if (job.id) {
    await r
      .table("job_request")
      .get(job.id)
      .delete();
  }
}

export async function exportCampaign(job) {
  console.log("exportingCampaign", job);
  const payload = JSON.parse(job.payload);
  const id = job.campaign_id;
  const campaign = await Campaign.get(id);
  const organization = await Organization.get(campaign.organization_id);
  const requester = payload.requester;
  const user = await User.get(requester);
  const allQuestions = {};
  const questionCount = {};
  const interactionSteps = await r
    .table("interaction_step")
    .getAll(id, { index: "campaign_id" });

  const combineSameQuestions = getConfig(
    "EXPORT_COMBINE_SAME_QUESTIONS",
    organization,
    { truthy: 1 }
  );

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

    if (currentCount > 0 && !combineSameQuestions) {
      allQuestions[step.id] = `${step.question}_${currentCount}`;
    } else {
      allQuestions[step.id] = step.question;
    }
  });
  const questionResponses = await r
    .knexReadOnly("question_response")
    .join("campaign_contact", "campaign_contact.id", "campaign_contact_id")
    .where("campaign_id", campaign.id)
    .select("campaign_contact_id", "interaction_step_id", "value");

  const tags = await r
    .knexReadOnly("tag_campaign_contact")
    .join("campaign_contact", "campaign_contact.id", "campaign_contact_id")
    .join("tag", "tag.id", "tag_id")
    .where("campaign_id", campaign.id)
    .select("campaign_contact_id", "name");
  const contactTags = tags.reduce((acc, cur) => {
    if (acc[cur.campaign_contact_id]) {
      acc[cur.campaign_contact_id].push(cur.name);
    } else {
      acc[cur.campaign_contact_id] = [cur.name];
    }
    return acc;
  }, {});

  const optOutJoins = process.env.OPTOUTS_SHARE_ALL_ORGS
    ? { "opt_out.cell": "campaign_contact.cell" }
    : {
        "opt_out.cell": "campaign_contact.cell",
        "opt_out.organization_id": r.knexReadOnly.raw(campaign.organization_id)
      };
  const contacts = await r
    .knexReadOnly("campaign_contact")
    .leftJoin("assignment", "campaign_contact.assignment_id", "assignment.id")
    .leftJoin("user", "assignment.user_id", "user.id")
    .leftJoin("zip_code", "zip_code.zip", "campaign_contact.zip")
    .leftJoin("opt_out", optOutJoins)
    .column([
      "campaign_contact.id",
      "campaign_contact.campaign_id",
      "campaign_contact.assignment_id",
      { optOutCampaign: "campaign_contact.is_opted_out" },
      { optedOut: "opt_out.created_at" },
      { texterFirst: "user.first_name" },
      { texterLast: "user.last_name" },
      { texterEmail: "user.email" },
      { texterCell: "user.cell" },
      { texterAlias: "user.alias" },
      "user.extra",
      "campaign_contact.external_id",
      "campaign_contact.first_name",
      "campaign_contact.last_name",
      "campaign_contact.cell",
      "zip_code.city",
      "zip_code.state",
      "campaign_contact.zip",
      "campaign_contact.custom_fields",
      "campaign_contact.message_status",
      "campaign_contact.error_code"
    ])
    .select()
    .where("campaign_contact.campaign_id", campaign.id);

  contacts.forEach((row, index) => {
    // Split Custom fields into columns
    const customFields = JSON.parse(row.custom_fields);
    delete row.custom_fields;

    // Add question response columns
    const responses = {};
    Object.keys(allQuestions).forEach(stepId => {
      const { value = "" } =
        questionResponses.find(response => {
          return (
            response.campaign_contact_id === row.id &&
            response.interaction_step_id === Number(stepId)
          );
        }) || {};

      if (
        value === "" &&
        !responses.hasOwnProperty(`question[${allQuestions[stepId]}]`)
      ) {
        responses[`question[${allQuestions[stepId]}]`] = "";
      } else if (
        value !== "" &&
        combineSameQuestions &&
        responses[`question[${allQuestions[stepId]}]`] &&
        responses[`question[${allQuestions[stepId]}]`] !== value
      ) {
        // join multiple different answers, otherwise combine answers too
        responses[`question[${allQuestions[stepId]}]`] += `, ${value}`;
      } else if (value !== "") {
        responses[`question[${allQuestions[stepId]}]`] = value;
      }
    });

    contacts[index] = {
      ...row,
      texterExtra: row.extra ? JSON.stringify(row.extra) : "",
      ...customFields,
      tags: contactTags[row.id] ? contactTags[row.id].join(", ") : "",
      ...responses
    };
    delete contacts[index]["extra"];
  });

  const messages = await r
    .knexReadOnly("message")
    .join("campaign_contact", "campaign_contact.id", "campaign_contact_id")
    .column([
      "campaign_contact_id",
      "campaign_id",
      "user_number",
      "contact_number",
      "is_from_contact",
      "send_status",
      { attempted_at: "message.created_at" },
      "text",
      "message.error_code"
    ])
    .select()
    .where("campaign_contact.campaign_id", campaign.id);

  const campaignCsv = Papa.unparse(contacts);
  const messageCsv = Papa.unparse(messages);
  const exportResults = {};
  console.log("exportCampaign csvs", campaignCsv.length, messageCsv.length);
  if (
    getConfig("AWS_ACCESS_AVAILABLE") ||
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  ) {
    try {
      const s3bucket = new S3({
        // The transformation for params is not implemented.
        // Refer to UPGRADING.md on aws-sdk-js-v3 for changes needed.
        // Please create/upvote feature request on aws-sdk-js-codemod for params.
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
      await s3bucket.putObject(params);
      params = { Key: key, Expires: 86400 };
      const campaignExportUrl = await getSignedUrl(s3bucket, new GetObjectCommand(params), {
        expiresIn: "/* add value from 'Expires' from v2 call if present, else remove */"
      });
      params = { Key: messageKey, Body: messageCsv };
      await s3bucket.putObject(params);
      params = { Key: messageKey, Expires: 86400 };
      const campaignMessagesExportUrl = await getSignedUrl(s3bucket, new GetObjectCommand(params), {
        expiresIn: "/* add value from 'Expires' from v2 call if present, else remove */"
      });
      exportResults.campaignExportUrl = campaignExportUrl;
      exportResults.campaignMessagesExportUrl = campaignMessagesExportUrl;

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
      exportResults.error = err.message;
      await sendEmail({
        to: user.email,
        subject: `Export failed for ${campaign.title}`,
        text: `Your Spoke exports failed... please try again later.
        Error: ${err.message}`
      });
    }
  } else if (process.env.NODE_ENV !== "production") {
    const contactsFile = `./campaign-export-${campaign.id}.csv`;
    const messagesFile = `./campaign-export-${campaign.id}-message.csv`;
    exportResults.campaignExportUrl =
      "file://" + path.resolve("./", contactsFile);
    exportResults.campaignMessagesExportUrl =
      "file://" + path.resolve("./", messagesFile);

    console.log(`Writing CSVs to ${contactsFile} and ${messagesFile}`);
    fs.writeFileSync(contactsFile, campaignCsv);
    fs.writeFileSync(messagesFile, messageCsv);
  } else {
    console.log("Would have saved the following to S3:");
    log.debug(campaignCsv);
    log.debug(messageCsv);
  }
  if (exportResults.campaignExportUrl) {
    exportResults.createdAt = String(new Date());
    await cacheableData.campaign.saveExportData(campaign.id, exportResults);
  }
  await defensivelyDeleteJob(job);
}

export async function extensionJob(job) {
  const payload = JSON.parse(job.payload);
  if (payload.path && payload.method) {
    const extension = require("../" + payload.path);
    if (extension && typeof extension[payload.method] === "function") {
      await extension[payload.method](job, payload);
    }
  }
}

export async function startCampaign(job) {
  const payload = JSON.parse(job.payload);
  const campaign = await cacheableData.campaign.load(job.campaign_id);
  const organization = await cacheableData.organization.load(
    payload.organizationId
  );
  const user = await cacheableData.user.userLoggedIn(
    payload.userLookupField,
    payload.userLookupValue
  );
  if (!campaign || !organization || !user) {
    return;
  }
  const serviceManagerData = await processServiceManagers(
    "onCampaignStart",
    organization,
    {
      user,
      campaign
    }
  );

  if (serviceManagerData && serviceManagerData.blockCampaignStart) {
    console.log(
      "campaign blocked from starting",
      campaign.id,
      serviceManagerData.blockCampaignStart
    );
    return;
  }

  await r
    .knex("campaign")
    .where("id", campaign.id)
    .update({ is_started: true });
  const reloadedCampaign = await cacheableData.campaign.load(campaign.id, {
    forceLoad: true
  });
  await sendUserNotification({
    type: Notifications.CAMPAIGN_STARTED,
    campaignId: campaign.id
  });

  if (job.id) {
    await r
      .knex("job_request")
      .where("id", job.id)
      .delete();
  }

  // One last update of is_opted_out during start in case contacts opted-out from running campaigns
  const updateOptOuts = await cacheableData.optOut.updateIsOptedOuts(query =>
    query
      .join("opt_out", {
        "opt_out.cell": "campaign_contact.cell",
        ...(!process.env.OPTOUTS_SHARE_ALL_ORGS
          ? { "opt_out.organization_id": "campaign.organization_id" }
          : {})
      })
      .where("campaign_contact.campaign_id", campaign.id)
  );
  if (updateOptOuts) {
    console.log("campaign start updated is_opted_out", updateOptOuts);
  }
  // We delete the job before invoking this task in case this process times out.
  // TODO: Decide if we want/need this anymore, relying on FUTURE campaign-contact cache load changes
  await jobRunner.dispatchTask(Tasks.CAMPAIGN_START_CACHE, {
    organization,
    campaign: reloadedCampaign
  });
}

export async function importScript(job) {
  const payload = await unzipPayload(job);
  try {
    await defensivelyDeleteOldJobsForCampaignJobType(job);
    await importScriptFromDocument(payload.campaignId, payload.url); // TODO try/catch
    console.log(`Script import complete ${payload.campaignId} ${payload.url}`);
  } catch (exception) {
    await r
      .knex("job_request")
      .where("id", job.id)
      .update({ result_message: exception.message, status: -1 });
    console.warn(exception.message);
    return;
  }
  defensivelyDeleteJob(job);
}

// add an in-memory guard that the same messages are being sent again and again
// not related to stale filter
let pastMessages = [];

export async function sendMessages(queryFunc, defaultStatus) {
  let trySendCount = 0;
  try {
    const trx = await r.knex.transaction();
    let messages = [];
    try {
      let messageQuery = trx("message")
        .forUpdate()
        .where({ send_status: defaultStatus || "QUEUED" })
        .join(
          "campaign_contact",
          "campaign_contact.id",
          "message.campaign_contact_id"
        )
        .join("campaign", "campaign.id", "campaign_contact.campaign_id")
        .join("organization", "organization.id", "campaign.organization_id")
        .select(
          "message.*",
          // These are the fields we need for message sending
          "campaign_contact.campaign_id",
          "campaign_contact.message_status",
          "campaign.messageservice_sid",
          "campaign.organization_id",
          "organization.features"
        );
      if (queryFunc) {
        messageQuery = queryFunc(messageQuery);
      }

      messages = await messageQuery.orderBy("created_at");
    } catch (err) {
      // Unable to obtain lock on these rows meaning another process must be
      // sending them. We will exit gracefully in that case.
      console.info("LOCKED ROWS", err);
      trx.rollback();
      return 0;
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
        message.service = message.service || getConfig("DEFAULT_SERVICE");
        const service = getService(message.service);
        log.info(
          `Sending (${message.service}): ${message.user_number} -> ${message.contact_number}\nMessage: ${message.text}`
        );
        try {
          await service.sendMessage({
            message,
            contact: {
              id: message.campaign_contact_id,
              message_status: message.message_status,
              campaign_id: message.campaign_id
            },
            trx,
            organization: {
              // TODO: probably not enough -- need a organization.load()
              id: message.organization_id,
              features: message.features
            },
            campaign: {
              // TODO: probably not enough -- need a organization.load()
              id: message.campaign_id,
              organization_id: message.organization_id,
              messageservice_sid: message.messageservice_sid
            }
          });
          pastMessages.push(message.id);
          pastMessages = pastMessages.slice(-100); // keep the last 100
        } catch (err) {
          console.error("Failed sendMessage", err);
        }
        trySendCount += 1;
      }
      await trx.commit();
    } catch (err) {
      console.error("Error sending messages:", err);
      await trx.rollback();
    }
  } catch (err) {
    console.log("sendMessages transaction errored:");
    console.error(err);
  }
  return trySendCount;
}

export async function handleIncomingMessageParts() {
  const messageParts = await r.table("pending_message_part").limit(100);
  const messagePartsByService = {};
  messageParts.forEach(m => {
    if (getService(m.service)) {
      if (!(m.service in messagePartsByService)) {
        messagePartsByService[m.service] = [];
      }
      messagePartsByService[m.service].push(m);
    }
  });
  for (const serviceKey in messagePartsByService) {
    let allParts = messagePartsByService[serviceKey];
    const service = getService(serviceKey);
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
        service: serviceKey,
        userNumber: part.user_number
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

export async function loadMessages(csvFile) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvFile, {
      header: true,
      complete: ({ data, meta, errors }, file) => {
        const fields = meta.fields;
        console.log("FIELDS", fields);
        console.log("FIRST LINE", data[0]);
        const promises = [];
        data.forEach(row => {
          if (!row.contact_number) {
            return;
          }
          const twilioMessage = {
            From: `+1${row.contact_number}`,
            To: `+1${row.user_number}`,
            Body: row.text,
            MessageSid: row.service_id,
            MessagingServiceSid: row.service_id,
            FromZip: row.zip, // unused at the moment
            spokeCreatedAt: row.created_at
          };
          promises.push(
            getService("twilio").handleIncomingMessage(twilioMessage)
          );
        });
        console.log("Started all promises for CSV");
        Promise.all(promises)
          .then(doneDid => {
            console.log(`Processed ${doneDid.length} rows for CSV`);
            resolve(doneDid);
          })
          .catch(err => {
            console.error("Error processing for CSV", err);
            reject(err);
          });
      }
    });
  });
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
          orglessUser.id +
          " to organization " +
          process.env.DEFAULT_ORG
      );
    }); // forEach
  } // if
} // function

export async function clearOldJobs(event) {
  // to clear out old stuck jobs
  const sixHoursAgo = new Date(new Date() - 1000 * 60 * 60 * 6);
  const delay = (event && event.oldJobPast) || sixHoursAgo;
  return await r
    .knex("job_request")
    .where({ assigned: true })
    .where("updated_at", "<", delay)
    .delete();
}

export async function buyPhoneNumbers(job) {
  try {
    if (!job.organization_id) {
      throw Error("organization_id is required");
    }
    const payload = JSON.parse(job.payload);
    const { areaCode, limit, opts } = payload;
    if (!areaCode || !limit) {
      throw new Error("areaCode and limit are required");
    }
    const organization = await cacheableData.organization.load(
      job.organization_id
    );
    const serviceClient = getServiceFromOrganization(organization);
    const totalPurchased = await serviceClient.buyNumbersInAreaCode(
      organization,
      areaCode,
      limit,
      opts
    );
    log.info(`Bought ${totalPurchased} number(s)`, {
      status: "COMPLETE",
      areaCode,
      limit,
      totalPurchased,
      organization_id: job.organization_id
    });
  } catch (err) {
    log.error(`JOB ${job.id} FAILED: ${err.message}`, err);
    console.log("full job error", err);
  } finally {
    await defensivelyDeleteJob(job);
  }
}

export async function deletePhoneNumbers(job) {
  try {
    if (!job.organization_id) {
      throw Error("organization_id is required");
    }
    const { areaCode } = JSON.parse(job.payload);
    if (!areaCode) {
      throw new Error("areaCode is required");
    }
    const organization = await cacheableData.organization.load(
      job.organization_id
    );
    const service = getServiceFromOrganization(organization);
    const totalDeleted = await service.deleteNumbersInAreaCode(
      organization,
      areaCode
    );
    log.info(`Deleted ${totalDeleted} number(s)`, {
      status: "COMPLETE",
      areaCode,
      totalDeleted,
      organization_id: job.organization_id
    });
  } catch (err) {
    log.error(`JOB ${job.id} FAILED: ${err.message}`, err);
  } finally {
    await defensivelyDeleteJob(job);
  }
}
