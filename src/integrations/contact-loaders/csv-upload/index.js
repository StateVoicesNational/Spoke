import { completeContactLoad } from "../../../workers/jobs";
import { r, CampaignContact } from "../../../server/models";
import { getConfig, hasConfig } from "../../../server/api/lib/config";

import { updateJob } from "../../../workers/lib";
import { getTimezoneByZip, unzipPayload } from "../../../workers/jobs";

export const name = "csv-upload";

export function displayName() {
  return "CSV Upload";
}

export function serverAdministratorInstructions() {
  return {
    environmentVariables: [],
    description: "CSV Upload a list of contacts",
    setupInstructions:
      "Nothing is necessary to setup since this is default functionality"
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
  return {
    result: true,
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
  return {
    data: "",
    expiresSeconds: 0
  };
}

export async function processContactLoad(job, maxContacts) {
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
  const jobMessages = [];

  await r
    .knex("campaign_contact")
    .where("campaign_id", campaignId)
    .delete();

  let contacts;
  if (job.payload[0] === "{") {
    contacts = JSON.parse(job.payload).contacts;
  } else {
    contacts = (await unzipPayload(job)).contacts;
  }
  if (maxContacts) {
    // note: maxContacts == 0 means no maximum
    contacts = contacts.slice(0, maxContacts);
  }
  const chunkSize = 1000;

  const numChunks = Math.ceil(contacts.length / chunkSize);

  for (let index = 0; index < contacts.length; index++) {
    const datum = contacts[index];
    if (datum.zip) {
      // using memoization and large ranges of homogenous zips
      datum.timezone_offset = await getTimezoneByZip(datum.zip);
    }
    datum.campaign_id = campaignId;
  }
  for (let index = 0; index < numChunks; index++) {
    await updateJob(job, Math.round((100 / numChunks) * index)).catch(err => {
      console.error("Error updating job:", campaignId, job.id, err);
    });
    const savePortion = contacts.slice(
      index * chunkSize,
      (index + 1) * chunkSize
    );
    await CampaignContact.save(savePortion).catch(err => {
      console.error("Error saving campaign contacts:", campaignId, err);
    });
  }

  await completeContactLoad(job, jobMessages);
}
