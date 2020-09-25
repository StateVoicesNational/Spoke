// Jobs are potentially long-running background processing operations
// that are tracked in the database via the JobRequest table.
// See src/extensions/job-runners/README.md for more details

import { r, cacheableData } from "../server/models";
import { sleep, getNextJob } from "./lib";
import { log } from "../lib";
import {
  dispatchContactIngestLoad,
  exportCampaign,
  processSqsMessages,
  assignTexters,
  sendMessages,
  handleIncomingMessageParts,
  fixOrgless,
  clearOldJobs,
  importScript,
  buyPhoneNumbers,
  startCampaignWithPhoneNumbers
} from "./jobs";
import { setupUserNotificationObservers } from "../server/notifications";
import { loadContactsFromDataWarehouseFragment } from "../extensions/contact-loaders/datawarehouse";

export { seedZipCodes } from "../server/seeds/seed-zip-codes";

/* For the 'legacy' job runner when JOBS_SAME_PROCESS is false:
   The main in both cases is to process jobs and send/receive messages
   on separate loop(s) from the web server.
   * job processing (e.g. contact loading) shouldn't delay text message processing

   The two process models:
   * Run the 'scripts' in dev-tools/Procfile.dev
*/

const JOBS_SAME_PROCESS = !!process.env.JOBS_SAME_PROCESS;

export const Jobs = Object.freeze({
  EXPORT: "export",
  ASSIGN_TEXTERS: "assign_texters",
  IMPORT_SCRIPT: "import_script",
  BUY_PHONE_NUMBERS: "buy_phone_numbers",
  START_CAMPAIGN_WITH_PHONE_NUMBERS: "start_campaign_with_phone_numbers"
});

const jobMap = Object.freeze({
  [Jobs.EXPORT]: exportCampaign,
  [Jobs.ASSIGN_TEXTERS]: assignTexters,
  [Jobs.IMPORT_SCRIPT]: importScript,
  [Jobs.BUY_PHONE_NUMBERS]: buyPhoneNumbers,
  [Jobs.START_CAMPAIGN_WITH_PHONE_NUMBERS]: startCampaignWithPhoneNumbers
});

export const invokeJobFunction = async job => {
  if (job.job_type in jobMap) {
    await jobMap[job.job_type](job);
  } else if (job.job_type.startsWith("ingest.")) {
    await dispatchContactIngestLoad(job);
  } else {
    throw new Error(`Job of type ${job.job_type} not found`);
  }
};

export async function processJobs() {
  // DEPRECATED -- switch to job dispatchers. See src/extensions/job-runners/README.md
  if (JOBS_SAME_PROCESS || process.env.JOB_RUNNER) {
    return;
  }
  setupUserNotificationObservers();
  console.log("Running processJobs");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await sleep(1000);
      const job = await getNextJob();
      if (job) {
        if (job.job_type in jobMap) {
          await jobMap[job.job_type](job);
        } else if (job.job_type.startsWith("ingest.")) {
          await dispatchContactIngestLoad(job);
        }
      }

      const twoMinutesAgo = new Date(new Date() - 1000 * 60 * 2);
      // clear out stuck jobs
      await clearOldJobs({ oldJobPast: twoMinutesAgo });
    } catch (ex) {
      log.error(ex);
    }
  }
}

export async function checkMessageQueue(event, contextVars) {
  console.log("checkMessageQueue", process.env.TWILIO_SQS_QUEUE_URL, event);
  const twilioSqsQueue =
    (event && event.TWILIO_SQS_QUEUE_URL) || process.env.TWILIO_SQS_QUEUE_URL;
  if (!twilioSqsQueue) {
    return;
  }

  console.log("checking if messages are in message queue");
  while (true) {
    try {
      if (event && event.delay) {
        await sleep(event.delay);
      }
      await processSqsMessages(twilioSqsQueue);
      if (
        contextVars &&
        typeof contextVars.remainingMilliseconds === "function"
      ) {
        if (contextVars.remainingMilliseconds() < 5000) {
          // rather than get caught half-way through a message batch, let's bail
          return;
        }
      }
    } catch (ex) {
      log.error(ex);
    }
  }
}

export async function loadContactsFromDataWarehouseFragmentJob(
  event,
  contextVars,
  eventCallback
) {
  try {
    const rv = await loadContactsFromDataWarehouseFragment(
      event, // double up argument
      event
    );
    if (eventCallback) {
      eventCallback(null, rv);
    }
  } catch (err) {
    if (eventCallback) {
      eventCallback(err, null);
    }
  }
  return "completed";
}

const messageSenderCreator = (subQuery, defaultStatus) => {
  return async (event, contextVars) => {
    console.log("Running a message sender");
    let sentCount = 0;
    setupUserNotificationObservers();
    let delay = 1100;
    if (event && event.delay) {
      delay = parseInt(event.delay, 10);
    }
    let maxCount = -1; // never ends with -1 since --maxCount will never be 0
    if (event && event.maxCount) {
      maxCount = parseInt(event.maxCount, 10) || -1;
    }
    // eslint-disable-next-line no-constant-condition
    while (--maxCount) {
      try {
        await sleep(delay);
        sentCount += await sendMessages(subQuery, defaultStatus);
      } catch (ex) {
        log.error(ex);
      }
      if (
        contextVars &&
        typeof contextVars.remainingMilliseconds === "function"
      ) {
        if (contextVars.remainingMilliseconds() < 5000) {
          return sentCount;
        }
      }
    }
    return sentCount;
  };
};

export const messageSender01 = messageSenderCreator(function(mQuery) {
  return mQuery.where(
    r.knex.raw("(contact_number LIKE '%0' OR contact_number LIKE '%1')")
  );
});

export const messageSender234 = messageSenderCreator(function(mQuery) {
  return mQuery.where(
    r.knex.raw(
      "(contact_number LIKE '%2' OR contact_number LIKE '%3' or contact_number LIKE '%4')"
    )
  );
});

export const messageSender56 = messageSenderCreator(function(mQuery) {
  return mQuery.where(
    r.knex.raw("(contact_number LIKE '%5' OR contact_number LIKE '%6')")
  );
});

export const messageSender789 = messageSenderCreator(function(mQuery) {
  return mQuery.where(
    r.knex.raw(
      "(contact_number LIKE '%7' OR contact_number LIKE '%8' or contact_number LIKE '%9')"
    )
  );
});

export const failedMessageSender = messageSenderCreator(function(mQuery) {
  // messages that were attempted to be sent five minutes ago in status=SENDING
  // when JOBS_SAME_PROCESS is enabled, the send attempt is done immediately.
  // However, if it's still marked SENDING, then it must have failed to go out.
  // This is dangerous to run in a scheduled event because if there is
  // any failure path that stops the status from updating, then users might keep getting
  // texts over and over
  const fiveMinutesAgo = new Date(new Date() - 1000 * 60 * 5);
  return mQuery.where("message.created_at", ">", fiveMinutesAgo);
}, "SENDING");

export const failedDayMessageSender = messageSenderCreator(function(mQuery) {
  // messages that were attempted to be sent five minutes ago in status=SENDING
  // when JOBS_SAME_PROCESS is enabled, the send attempt is done immediately.
  // However, if it's still marked SENDING, then it must have failed to go out.
  // This is dangerous to run in a scheduled event because if there is
  // any failure path that stops the status from updating, then users might keep getting
  // texts over and over
  const oneDayAgo = new Date(new Date() - 1000 * 60 * 60 * 24);
  return mQuery.where("message.created_at", ">", oneDayAgo);
}, "SENDING");

export const erroredMessageSender = messageSenderCreator(function(mQuery) {
  // messages that were attempted to be sent twenty minutes ago in status=SENDING
  // and also error_code < 0 which means a DNS error.
  // when JOBS_SAME_PROCESS is enabled, the send attempt is done immediately.
  // However, if it's still marked SENDING, then it must have failed to go out.
  // This is OK to run in a scheduled event because we are specifically narrowing on the error_code
  // It's important though that runs are never in parallel
  const twentyMinutesAgo = new Date(new Date() - 1000 * 60 * 20);
  console.log("erroredMessageSender", twentyMinutesAgo);
  return mQuery
    .where("message.created_at", ">", twentyMinutesAgo)
    .where("message.error_code", "<", 0);
}, "SENDING");

export async function handleIncomingMessages() {
  if (process.env.DEBUG_INCOMING_MESSAGES) {
    console.log("Running handleIncomingMessages");
  }
  if (JOBS_SAME_PROCESS && process.env.DEFAULT_SERVICE === "twilio") {
    // no need to handle incoming messages
    return;
  }
  setupUserNotificationObservers();
  // eslint-disable-next-line no-constant-condition
  let i = 0;
  while (true) {
    try {
      if (process.env.DEBUG_SCALING) {
        console.log("entering handleIncomingMessages. round: ", ++i);
      }
      const countPendingMessagePart = await r
        .knex("pending_message_part")
        .count("id AS total")
        .then(total => {
          let totalCount = 0;
          totalCount = total[0].total;
          return totalCount;
        });
      if (process.env.DEBUG_SCALING) {
        console.log(
          "counting handleIncomingMessages. count: ",
          countPendingMessagePart
        );
      }
      await sleep(500);
      if (countPendingMessagePart > 0) {
        if (process.env.DEBUG_SCALING) {
          console.log("running handleIncomingMessages");
        }
        await handleIncomingMessageParts();
      }
    } catch (ex) {
      log.error("error at handleIncomingMessages", ex);
    }
  }
}

export async function updateOptOuts(event, context, eventCallback) {
  // Especially for auto-optouts, campaign_contact.is_opted_out is not
  // always updated and depends on this batch job to run
  // We avoid it in-process to avoid db-write thrashing on optouts
  // so they don't appear in queries
  const res = await cacheableData.optOut.updateIsOptedOuts(query =>
    query
      .join("opt_out", {
        "opt_out.cell": "campaign_contact.cell",
        ...(!process.env.OPTOUTS_SHARE_ALL_ORGS
          ? { "opt_out.organization_id": "campaign.organization_id" }
          : {})
      })
      .where(
        "opt_out.created_at",
        ">",
        new Date(
          new Date() - ((event && event.milliseconds_past) || 1000 * 60 * 60) // default 1 hour back
        )
      )
  );
  if (res) {
    console.log("updateOptOuts contacts updated", res);
  }
}

export async function runDatabaseMigrations(event, context, eventCallback) {
  console.log("inside runDatabaseMigrations1");
  console.log("inside runDatabaseMigrations2", event);
  await r.k.migrate.latest();
  console.log("after latest() runDatabaseMigrations", event);
  if (eventCallback) {
    eventCallback(null, "completed migrations");
  }
  return "completed migrations runDatabaseMigrations";
}

export async function databaseMigrationChange(event, context, eventCallback) {
  console.log("inside databaseMigrationChange", event);
  if (event.up) {
    await r.k.migrate.up();
  } else {
    await r.k.migrate.down();
  }
  console.log("after databaseMigrationChange", event);
  if (eventCallback) {
    eventCallback(null, "completed databaseMigrationChange");
  }
  return "completed databaseMigrationChange";
}

const processMap = {
  processJobs,
  messageSender01,
  messageSender234,
  messageSender56,
  messageSender789,
  handleIncomingMessages,
  fixOrgless
};

// if process.env.JOBS_SAME_PROCESS then we don't need to run
// the others and messageSender should just pick up the stragglers
let syncProcessMap = {
  // 'failedMessageSender': failedMessageSender, //see method for danger
  erroredMessageSender,
  handleIncomingMessages,
  checkMessageQueue,
  fixOrgless,
  clearOldJobs,
  updateOptOuts
};

export async function dispatchProcesses(event, context, eventCallback) {
  const toDispatch =
    event.processes || (JOBS_SAME_PROCESS ? syncProcessMap : processMap);

  if (process.env.PROCESS_MAP) {
    try {
      // allow user-defined jobs via env var,
      // removing any that are not in provided comma-separated list
      const envProcessMap = String(process.env.PROCESS_MAP).split(",");
      Object.keys(toDispatch).forEach(key => {
        if (!envProcessMap.includes(key.trim())) {
          delete toDispatch[key.trim()];
        }
      });
    } catch (err) {
      console.log(err);
    }
  }

  const allResults = await Promise.all(
    Object.keys(toDispatch).map(p => {
      const prom = toDispatch[p](event, context).catch(err => {
        console.error("dispatchProcesses Process Error", p, err);
      });
      console.log("dispatchProcesses", p);
      return prom;
    })
  );
  console.log("dispatchProcesses results", allResults);
  return "completed";
}

export async function ping(event, context) {
  return "pong";
}

export default {
  runDatabaseMigrations,
  databaseMigrationChange,
  dispatchProcesses,
  ping,
  processJobs,
  checkMessageQueue,
  loadContactsFromDataWarehouseFragmentJob,
  messageSender01,
  messageSender234,
  messageSender56,
  messageSender789,
  handleIncomingMessages
};
