/* eslint-disable consistent-return */
/* eslint-disable dot-notation */
import { completeContactLoad } from "../../../workers/jobs";
import { r } from "../../../server/models";
import { getConfig, hasConfig } from "../../../server/api/lib/config";
import { log } from "../../../lib/log";
import { searchGroups, getGroupMembers, getCustomFields } from "./util";
import {
  CIVICRM_INTEGRATION_GROUPSEARCH_ENDPOINT,
  CIVICRM_MINQUERY_SIZE,
  ENVIRONMENTAL_VARIABLES_MANDATORY,
  ENVIRONMENTAL_VARIABLES_OPTIONAL,
  CIVICRM_CONTACT_LOADER
} from "./const";
import { getCacheLength } from "./getcachelength";
import { getFormattedPhoneNumber } from "../../../lib";

// Some enviornmental variables are mandatory; others are optional.

export const name = CIVICRM_CONTACT_LOADER;

export function displayName() {
  return "CiviCRM";
}

export function serverAdministratorInstructions() {
  return {
    environmentVariables: [
      ...ENVIRONMENTAL_VARIABLES_MANDATORY,
      ...ENVIRONMENTAL_VARIABLES_OPTIONAL
    ],
    description: "Allows you to pull contacts directly from CiviCRM",
    setupInstructions:
      "Configure the mandatory environment variables to connect to a CiviCRM instance"
  };
}

// eslint-disable-next-line no-unused-vars
export async function available(_organization, _user) {
  // return an object with two keys: result: true/false
  // these keys indicate if the ingest-contact-loader is usable
  // Sometimes credentials need to be setup, etc.
  // A second key expiresSeconds: should be how often this needs to be checked
  // If this is instantaneous, you can have it be 0 (i.e. always), but if it takes time
  // to e.g. verify credentials or test server availability,
  // then it's better to allow the result to be cached
  const result = ENVIRONMENTAL_VARIABLES_MANDATORY.every(varName =>
    hasConfig(varName)
  );
  return {
    result,
    expiresSeconds: getCacheLength(CIVICRM_CONTACT_LOADER)
  };
}

export function addServerEndpoints(expressApp) {
  // If you need to create API endpoints for server-to-server communication
  // this is where you would run e.g. app.post(....)
  // Be mindful of security and make sure there's
  // This is NOT where or how the client send or receive contact data
  expressApp.get(CIVICRM_INTEGRATION_GROUPSEARCH_ENDPOINT, (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({});
    }

    const { query } = req.query;
    if (query.length < CIVICRM_MINQUERY_SIZE) return res.json({ groups: [] }); // ignore dumb queries

    searchGroups(query || "", 1)
      .then(groups => res.json({ groups }))
      .catch(error => {
        log.error(error);
        res.json({ groups: [], error });
      });
  });
}

// eslint-disable-next-line no-unused-vars
export function clientChoiceDataCacheKey(campaign, _user) {
  // returns a string to cache getClientChoiceData -- include items that relate to cacheability
  return `${campaign.id}`;
}

// eslint-disable-next-line no-unused-vars
export async function getClientChoiceData(_organization, _campaign, _user) {
  // data to be sent to the admin client to present options to the component or similar
  // The react-component will be sent this data as a property
  // return a json object which will be cached for expiresSeconds long
  // `data` should be a single string -- it can be JSON which you can parse in the client component
  return {
    data: "{}",
    expiresSeconds: getCacheLength(CIVICRM_CONTACT_LOADER)
  };
}

// eslint-disable-next-line no-unused-vars
export async function processContactLoad(job, _maxContacts, _organization) {
  //  Trigger processing -- this will likely be the most important part
  //  you should load contacts into the contact table with the job.campaign_id
  //  Since this might just *begin* the processing and other work might
  //  need to be completed asynchronously after this is completed (e.g. to distribute loads)
  //  After true contact-load completion, this (or another function)
  //  MUST call src/workers/jobs.js::completeContactLoad(job)
  //    The async function completeContactLoad(job) will
  //       - delete contacts that are in the opt_out table,
  //       - delete duplicate cells,
  //       - clear/update caching, etc.
  //  The organization parameter is an object containing the name and other
  //    details about the organization on whose behalf this contact load
  //    was initiated. It is included here so it can be passed as the
  //    second parameter of getConfig in order to retrieve organization-
  //    specific configuration values.
  //  Basic responsibilities:
  //  1. Delete previous campaign contacts on a previous choice/upload
  //  2. Set campaign_contact.campaign_id = job.campaign_id on all uploaded contacts
  //  3. Set campaign_contact.message_status = "needsMessage" on all uploaded contacts
  //  4. Ensure that campaign_contact.cell is in the standard phone format "+15551234567"
  //     -- do NOT trust your backend to ensure this
  //  5. If your source doesn't have timezone offset info already, then you need to
  //     fill the campaign_contact.timezone_offset with getTimezoneByZip(contact.zip) (from "../../workers/jobs")
  //  Things to consider in your implementation:
  //      - Batching
  //      - Error handling
  //      - "Request of Doom" scenarios -- queries or jobs too big to complete

  const campaignId = job.campaign_id;

  const customFields = getCustomFields(getConfig("CIVICRM_CUSTOM_DATA"));
  const customFieldNames = Object.keys(customFields);

  await r
    .knex("campaign_contact")
    .where("campaign_id", campaignId)
    .delete();

  const contactData = JSON.parse(job.payload);

  let finalCount = 0;
  const contactsForAdding = {};
  for (const group of contactData.groupIds) {
    // eslint-disable-next-line no-loop-func
    await getGroupMembers(group.id, async results => {
      const newContacts = results
        .filter(res => res["api.Phone.get"]["count"] > 0)
        .map(res => {
          const customFieldOutput = {
            phone_id: res["api.Phone.get"]["values"][0]["id"]
          };
          for (const customFieldName of customFieldNames) {
            if (customFieldName in res) {
              customFieldOutput[customFields[customFieldName]] =
                res[customFieldName] || "";
            }
          }

          return {
            first_name: res.first_name,
            last_name: res.last_name,
            cell: getFormattedPhoneNumber(
              res["api.Phone.get"]["values"][0]["phone_numeric"],
              getConfig("PHONE_NUMBER_COUNTRY")
            ),
            zip: res.postal_code,
            external_id: res.id,
            custom_fields: JSON.stringify(customFieldOutput),
            message_status: "needsMessage",
            campaign_id: campaignId
          };
        })
        .filter(res => res.cell !== "");

      // Spoke will not store multiple records with the same phone number.
      // It goes for a "last record wins" strategy, so we do the same. Note
      // that this also helps us prevent double-counting of contacts when
      // they appear in more than one group.

      for (const contactRecord of newContacts) {
        contactsForAdding[contactRecord.cell] = contactRecord;
      }
    });
  }

  const newContactRecords = Object.values(contactsForAdding);
  finalCount = newContactRecords.length;

  if (finalCount) {
    await r.knex.batchInsert("campaign_contact", newContactRecords, finalCount);
  }

  await completeContactLoad(
    job,
    null,
    // see failedContactLoad above for descriptions
    String(contactData.groupId),
    JSON.stringify({ finalCount })
  );
}
