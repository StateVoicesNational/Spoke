import { completeContactLoad, failedContactLoad } from "../../../workers/jobs";
import { r } from "../../../server/models";
import { getConfig, hasConfig } from "../../../server/api/lib/config";
import { searchGroups, getGroupMembers, CUSTOM_DATA } from "./util";
import _ from "lodash";
import { getFormattedPhoneNumber } from "../../../lib";

export const name = "civicrm";

export function displayName() {
  return "CiviCrm";
}

export function serverAdministratorInstructions() {
  return {
    environmentVariables: [
      "CIVICRM_API_KEY",
      "CIVICRM_SITE_KEY",
      "CIVICRM_DOMAIN"
    ],
    description: "Allows you to pull contacts directly from CiviCRM",
    setupInstructions: "Configure the environment variables"
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
  const result = serverAdministratorInstructions().environmentVariables.every(
    name => hasConfig(name)
  );
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
  expressApp.get("/integration/civicrm/groupsearch", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({});
    }

    const { query } = req.query;
    if (query.length < 3) return res.json({ groups: [] }); // ignore dumb queries

    searchGroups(query || "")
      .then(groups => res.json({ groups }))
      .catch(error => {
        console.error(error);
        res.json({ groups: [], error });
      });
  });
}

export function clientChoiceDataCacheKey(campaign, user) {
  /// returns a string to cache getClientChoiceData -- include items that relate to cacheability
  return `${campaign.id}`;
}

export async function getClientChoiceData(organization, campaign, user) {
  /// data to be sent to the admin client to present options to the component or similar
  /// The react-component will be sent this data as a property
  /// return a json object which will be cached for expiresSeconds long
  /// `data` should be a single string -- it can be JSON which you can parse in the client component
  return {
    data: "{}",
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

  const campaignId = job.campaign_id;

  await r
    .knex("campaign_contact")
    .where("campaign_id", campaignId)
    .delete();

  const contactData = JSON.parse(job.payload);
  console.log("contactData: " + JSON.stringify(contactData));

  const totalExpected = _.sum(_.map(contactData.groupIds, "count"));

  let finalCount = 0;
  for (const group of contactData.groupIds) {
    finalCount += await getGroupMembers(group.id, async results => {
      const newContacts = results.map(res => ({
        first_name: res.first_name,
        last_name: res.last_name,
        cell: getFormattedPhoneNumber(
          res.phone,
          getConfig("PHONE_NUMBER_COUNTRY")
        ),
        zip: res.postal_code,
        external_id: res.id,
        custom_fields: JSON.stringify(_.pick(res, CUSTOM_DATA)),
        message_status: "needsMessage",
        campaign_id: campaignId
      }));
      console.log("loading", newContacts.length, "contacts");

      await r.knex.batchInsert(
        "campaign_contact",
        newContacts,
        newContacts.length
      );
    });
  }

  await completeContactLoad(
    job,
    null,
    // see failedContactLoad above for descriptions
    String(contactData.groupId),
    JSON.stringify({ finalCount })
  );
}
