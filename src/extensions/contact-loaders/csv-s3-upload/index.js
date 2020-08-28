import { finalizeContactLoad } from "../helpers";
import { unzipPayload } from "../../../workers/jobs";
import { getConfig, hasConfig } from "../../../server/api/lib/config";
import { gunzip } from "../../../lib";

import AWS from "aws-sdk";

export const name = "csv-s3-upload";

export function displayName() {
  return "S3 CSV Upload";
}

export function serverAdministratorInstructions() {
  return {
    environmentVariables: [
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "AWS_S3_BUCKET_NAME",
      "AWS_REGION"
    ],
    description: "CSV Upload a list of contacts to S3",
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
    result: result,
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

export async function getClientChoiceData(
  organization,
  campaign,
  user,
  loaders
) {
  /// data to be sent to the admin client to present options to the component or similar
  /// The react-component will be sent this data as a property
  /// return a json object which will be cached for expiresSeconds long
  /// `data` should be a single string -- it can be JSON which you can parse in the client component
  const s3 = new AWS.S3({
    signatureVersion: "v4",
    region: getConfig("AWS_REGION")
  });
  const key = `contacts-upload/${campaign.id}/contacts.json.gz`;

  const params = {
    Bucket: getConfig("AWS_S3_BUCKET_NAME"),
    Key: key,
    ContentType: "application/x-www-form-urlencoded",
    Expires: 1800 // 30 minutes
  };

  const result = await s3.getSignedUrl("putObject", params);

  return {
    data: JSON.stringify({ s3Url: result, s3key: key }),
    expiresSeconds: 0
  };
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
  const s3 = new AWS.S3({
    signatureVersion: "v4",
    region: getConfig("AWS_REGION")
  });
  var params = {
    Bucket: getConfig("AWS_S3_BUCKET_NAME"),
    Key: job.payload
  };

  const contactsData = (await s3.getObject(params).promise()).Body.toString(
    "utf-8"
  );
  const contacts = JSON.parse(await gunzip(Buffer.from(contactsData, "base64")))
    .contacts;

  const contactsCount = contacts.length;
  await finalizeContactLoad(
    job,
    contacts,
    maxContacts,
    job.payload,
    JSON.stringify({ finalCount: contactsCount })
  );
}
