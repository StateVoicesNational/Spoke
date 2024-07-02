import {
  completeContactLoad,
  failedContactLoad,
  getTimezoneByZip,
  sendJobToAWSLambda
} from "../../../workers/jobs";
import { r } from "../../../server/models";
import { getConfig, hasConfig } from "../../../server/api/lib/config";
import { getFormattedPhoneNumber } from "../../../lib/phone-format.js";
import { log, gunzip } from "../../../lib";

import path from "path";
import Papa from "papaparse";
import { S3 } from "@aws-sdk/client-s3";

export const name = "s3-pull";

export function displayName() {
  return "S3 CSV Pull";
}

export function serverAdministratorInstructions() {
  return {
    environmentVariables: [
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "AWS_S3_BUCKET_NAME",
      "AWS_REGION"
    ],
    description: "S3 Contact load",
    setupInstructions: "AWS S3 needs to be setup"
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
    hasConfig("AWS_S3_BUCKET_NAME") &&
    hasConfig("AWS_REGION") &&
    hasConfig("AWS_ACCESS_KEY_ID") &&
    hasConfig("AWS_SECRET_ACCESS_KEY");
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
  //return `${organization.id}-${campaign.id}`;
  return "";
}

export async function getClientChoiceData(organization, campaign, user) {
  /// data to be sent to the admin client to present options to the component or similar
  /// The react-component will be sent this data as a property
  /// return a json object which will be cached for expiresSeconds long
  /// `data` should be a single string -- it can be JSON which you can parse in the client component

  // FUTURE: maybe expose list of exports visible
  return {
    data: "",
    expiresSeconds: 0
  };
}

export async function loadContactS3PullProcessFile(jobEvent, contextVars) {
  const {
    fileIndex,
    campaign_id,
    manifestData,
    s3Bucket,
    s3Path,
    indexes,
    customIndexes,
    region
  } = jobEvent;
  const s3 = new S3({
    region,

    // The key signatureVersion is no longer supported in v3, and can be removed.
    // @deprecated SDK v3 only supports signature v4.
    signatureVersion: "v4"
  });

  if (jobEvent.completeContactLoad) {
    await completeContactLoad(
      jobEvent,
      null,
      jobEvent.completeContactLoad.ingestDataReference,
      jobEvent.completeContactLoad.ingestResult
    );
    return;
  }
  const fileData = await s3
    .getObject({
      Bucket: s3Bucket,
      // removes the protocol/domain parts
      Key: manifestData.entries[fileIndex].url
        .split("/")
        .slice(3)
        .join("/")
    });
  const fileString = await gunzip(fileData.Body);
  const { data, errors } = await new Promise((resolve, reject) => {
    Papa.parse(fileString.toString(), {
      delimiter: "|",
      skipEmptyLines: true,
      escapeChar: "\\",
      error: (err, file, inputElem, reason) => {
        console.log("s3pull ERROR", err, reason);
        resolve({ errors: [err] });
      },
      complete: ({ data, errors, meta }) => {
        console.log("s3pull data", data.length, errors, meta);
        resolve({ data, errors });
      }
    });
  });

  if (data) {
    let insertRows = data.map(colData => {
      const contact = {
        campaign_id,
        assignment_id: null,
        message_status: "needsMessage"
      };
      const customFields = {};
      Object.keys(indexes).forEach(n => {
        contact[n] = indexes[n] === -1 ? "" : colData[indexes[n]];
      });
      contact.cell = getFormattedPhoneNumber(
        contact.cell,
        process.env.PHONE_NUMBER_COUNTRY || "US"
      );
      customIndexes.forEach(i => {
        customFields[manifestData.schema.elements[i].name] = colData[i];
      });
      contact.custom_fields = JSON.stringify(customFields);
      if (customFields.hasOwnProperty("timezone_offset")) {
        contact.timezone_offset = customFields["timezone_offset"];
      }
      return contact;
    });
    // memoize and update all the timezone_offsets:
    const tzOffsets = {};
    insertRows
      .filter(r => r.zip && !r.timezone_offset)
      .forEach(r => {
        tzOffsets[r.zip] = "";
      });
    if (Object.keys(tzOffsets).length) {
      for (let zip in tzOffsets) {
        tzOffsets[zip] = await getTimezoneByZip(zip);
      }
      insertRows = insertRows.map(r => {
        if (r.zip && !r.timezone_offset && tzOffsets[r.zip]) {
          r.timezone_offset = tzOffsets[r.zip];
        }
        return r;
      });
    }
    // In case the job was discarded, before we save,
    // we confirm the job still exists.
    const jobCompleted = await r
      .knex("job_request")
      .where("id", jobEvent.id)
      .select("status")
      .first();
    if (!jobCompleted) {
      console.log(
        "loadContactS3PullProcessFile job no longer exists",
        jobEvent
      );
      return { alreadyComplete: 1 };
    }

    await r.knex.batchInsert("campaign_contact", insertRows);
  }

  if (fileIndex < manifestData.entries.length - 1) {
    await r
      .knex("job_request")
      .where("id", jobEvent.id)
      .update({
        status: Math.round(
          (100 * (fileIndex + 1)) / manifestData.entries.length
        )
      });
    const newJobEvent = {
      ...jobEvent,
      fileIndex: fileIndex + 1,
      command: "loadContactS3PullProcessFileJob"
    };
    if (process.env.WAREHOUSE_DB_LAMBDA_ITERATION) {
      console.log(
        "SENDING TO LAMBDA loadContactS3PullProcessFileJob",
        newJobEvent
      );
      await sendJobToAWSLambda(newJobEvent);
      return { invokedAgain: 1 };
    } else {
      return await loadContactS3PullProcessFile(newJobEvent, contextVars);
    }
  } else {
    // Finished last insert
    const validationStats = {};
    // delete invalid cells
    await r
      .knex("campaign_contact")
      .whereRaw("length(cell) != 12")
      .andWhere("campaign_id", campaign_id)
      .delete()
      .then(result => {
        console.log(
          `loadContactS3PullProcessFile # of contacts with invalid cells removed from DW query (${campaign_id}): ${result}`
        );
        validationStats.invalidCellCount = result;
      });
    if (process.env.WAREHOUSE_DB_LAMBDA_ITERATION) {
      await completeContactLoad(
        jobEvent,
        null,
        { manifestData, s3Path },
        { errors, validationStats }
      );
    } else {
      const newJobEvent = {
        ...jobEvent,
        completeContactLoad: {
          ingestDataReference: { manifestData, s3Path },
          ingestResult: { errors, validationStats }
        },
        command: "loadContactS3PullProcessFileJob"
      };
      await sendJobToAWSLambda(newJobEvent);
    }
  }
}

export async function processContactLoad(job, maxContacts, organization) {
  console.log("STARTING s3-pull load", job.id, job.payload);
  const jobMessages = [];
  const s3Path = JSON.parse(job.payload).s3Path;
  const s3Bucket = getConfig("AWS_S3_BUCKET_NAME", organization);
  const region = getConfig("AWS_REGION", organization);
  const s3 = new S3({
    region,

    // The key signatureVersion is no longer supported in v3, and can be removed.
    // @deprecated SDK v3 only supports signature v4.
    signatureVersion: "v4"
  });

  const manifestPath = s3Path.endsWith("manifest")
    ? s3Path
    : path.join(s3Path, "manifest");
  console.log("s3-pull manifest path: ", manifestPath.replace(/^\//, ""));
  let manifestData;
  try {
    const manifestFile = await s3
      .getObject({
        Bucket: s3Bucket,
        Key: manifestPath.replace(/^\//, "")
      });
    manifestData = JSON.parse(manifestFile.Body.toString("utf-8"));
  } catch (err) {
    await failedContactLoad(
      job,
      null,
      { s3Path },
      {
        errors: [err],
        manifestPath: manifestPath.replace(/^\//, "")
      }
    );
    return;
  }
  console.log("s3-pull manifest found", manifestData);
  // 1. check manifestData.schema -- if not demand "MANIFEST VERBOSE"
  if (!manifestData.schema || !manifestData.schema.elements) {
    await failedContactLoad(
      job,
      null,
      { s3Path, manifestData },
      {
        errors: [
          "Manifest file did not have schema info -- make sure to run with MANIFEST VERBOSE"
        ]
      }
    );
    return;
  }

  // 2. check for cell, first_name, last_name in columns
  const indexes = {
    first_name: manifestData.schema.elements.findIndex(
      x => x.name === "first_name"
    ),
    last_name: manifestData.schema.elements.findIndex(
      x => x.name === "last_name"
    ),
    cell: manifestData.schema.elements.findIndex(x => x.name === "cell"),
    zip: manifestData.schema.elements.findIndex(x => x.name === "zip"),
    external_id: manifestData.schema.elements.findIndex(
      x => x.name === "external_id"
    )
  };
  if (
    indexes.first_name === -1 ||
    indexes.last_name === -1 ||
    indexes.cell === -1
  ) {
    const colNames = manifestData.schema.elements.map(x => x.name).join(", ");
    const error = `Missing at least one required column: first_name, last_name, cell. Columns: ${colNames}`;
    await failedContactLoad(
      job,
      null,
      { s3Path, manifestData },
      {
        errors: [error]
      }
    );
    return;
  }
  const customIndexes = manifestData.schema.elements
    .map((x, i) => [x.name, i])
    .filter(x => !(x[0] in indexes))
    .map(x => x[1]);

  // Delete old data; FUTURE: checkbox to 'pick up from before?'
  await r
    .knex("campaign_contact")
    .where("campaign_id", job.campaign_id)
    .delete();

  const event = {
    id: job.id,
    campaign_id: job.campaign_id,
    job_type: "ingest.s3-pull",
    // beyond job object:
    s3Path,
    s3Bucket,
    region,
    manifestData,
    indexes,
    customIndexes,
    fileIndex: 0
  };
  return await loadContactS3PullProcessFile(event);
}
