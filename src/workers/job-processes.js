// Jobs are potentially long-running background processing operations
// that are tracked in the database via the JobRequest table.
// See src/integrations/job-runners/README.md for more details

import { r } from "../server/models";
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
  buyPhoneNumbers
} from "./jobs";
import { setupUserNotificationObservers } from "../server/notifications";

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
  BUY_PHONE_NUMBERS: "buy_phone_numbers"
});

const jobMap = Object.freeze({
  [Jobs.EXPORT]: exportCampaign,
  [Jobs.ASSIGN_TEXTERS]: assignTexters,
  [Jobs.IMPORT_SCRIPT]: importScript,
  [Jobs.BUY_PHONE_NUMBERS]: buyPhoneNumbers
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
      await clearOldJobs(twoMinutesAgo);
    } catch (ex) {
      log.error(ex);
    }
  }
}

export async function checkMessageQueue() {
  if (!process.env.TWILIO_SQS_QUEUE_URL) {
    return;
  }

  console.log("checking if messages are in message queue");
  while (true) {
    try {
      await sleep(10000);
      processSqsMessages();
    } catch (ex) {
      log.error(ex);
    }
  }
}

const messageSenderCreator = (subQuery, defaultStatus) => {
  return async event => {
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
  return mQuery.where("created_at", ">", fiveMinutesAgo);
}, "SENDING");

export const failedDayMessageSender = messageSenderCreator(function(mQuery) {
  // messages that were attempted to be sent five minutes ago in status=SENDING
  // when JOBS_SAME_PROCESS is enabled, the send attempt is done immediately.
  // However, if it's still marked SENDING, then it must have failed to go out.
  // This is dangerous to run in a scheduled event because if there is
  // any failure path that stops the status from updating, then users might keep getting
  // texts over and over
  const oneDayAgo = new Date(new Date() - 1000 * 60 * 60 * 24);
  return mQuery.where("created_at", ">", oneDayAgo);
}, "SENDING");

export const erroredMessageSender = messageSenderCreator(function(mQuery) {
  // messages that were attempted to be sent twenty minutes ago in status=SENDING
  // and also error_code < 0 which means a DNS error.
  // when JOBS_SAME_PROCESS is enabled, the send attempt is done immediately.
  // However, if it's still marked SENDING, then it must have failed to go out.
  // This is OK to run in a scheduled event because we are specifically narrowing on the error_code
  // It's important though that runs are never in parallel
  const twentyMinutesAgo = new Date(new Date() - 1000 * 60 * 20);
  return mQuery
    .where("created_at", ">", twentyMinutesAgo)
    .where("error_code", "<", 0);
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

export async function runDatabaseMigrations(event, dispatcher, eventCallback) {
  console.log("inside runDatabaseMigrations1");
  console.log("inside runDatabaseMigrations2", event);
  await r.k.migrate.latest();
  console.log("after latest() runDatabaseMigrations", event);
  if (eventCallback) {
    eventCallback(null, "completed migrations");
  }
  return "completed migrations runDatabaseMigrations";
}

export async function databaseMigrationChange(
  event,
  dispatcher,
  eventCallback
) {
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
const syncProcessMap = {
  // 'failedMessageSender': failedMessageSender, //see method for danger
  erroredMessageSender,
  handleIncomingMessages,
  checkMessageQueue,
  fixOrgless,
  clearOldJobs
};

export async function dispatchProcesses(event, dispatcher, eventCallback) {
  const toDispatch =
    event.processes || (JOBS_SAME_PROCESS ? syncProcessMap : processMap);
  for (let p in toDispatch) {
    if (p in processMap) {
      // / not using dispatcher, but another interesting model would be
      // / to dispatch processes to other lambda invocations
      // dispatcher({'command': p})
      console.log("process", p);
      toDispatch[p]()
        .then()
        .catch(err => {
          console.error("Process Error", p, err);
        });
    }
  }
  return "completed";
}

export async function ping(event, dispatcher) {
  return "pong";
}

export default {
  runDatabaseMigrations,
  databaseMigrationChange,
  dispatchProcesses,
  ping,
  processJobs,
  checkMessageQueue,
  messageSender01,
  messageSender234,
  messageSender56,
  messageSender789,
  handleIncomingMessages
};
