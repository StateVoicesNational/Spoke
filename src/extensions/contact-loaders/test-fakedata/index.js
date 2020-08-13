import { completeContactLoad, failedContactLoad } from "../../../workers/jobs";
import { r } from "../../../server/models";
import { getConfig, hasConfig } from "../../../server/api/lib/config";

export const name = "test-fakedata";

export function displayName() {
  return "Fake Data for Testing";
}

export function serverAdministratorInstructions() {
  return {
    environmentVariables: [],
    description: "",
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
  const orgFeatures = JSON.parse(organization.features || "{}");
  const result =
    (orgFeatures.service || getConfig("DEFAULT_SERVICE", organization)) ===
    "fakeservice";
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
  return `${organization.id}-${campaign.id}`;
}

export async function getClientChoiceData(organization, campaign, user) {
  /// data to be sent to the admin client to present options to the component or similar
  /// The react-component will be sent this data as a property
  /// return a json object which will be cached for expiresSeconds long
  /// `data` should be a single string -- it can be JSON which you can parse in the client component
  return {
    data: `choice data from server`,
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
  if (contactData.requestContactCount === 42) {
    await failedContactLoad(
      job,
      null,
      // a reference so you can persist user choices
      // This will be lastResult.reference in react-component property
      String(contactData.requestContactCount),
      // a place where you can save result messages based on the outcome
      // This will be lastResult.result in react-component property
      JSON.stringify({
        message:
          "42 is life, the universe everything. Please choose a different number."
      })
    );
    return; // bail early
  }
  const areaCodes = ["213", "323", "212", "718", "646", "661"];
  const contactCount = Math.min(
    contactData.requestContactCount || 0,
    maxContacts ? maxContacts : areaCodes.length * 100,
    areaCodes.length * 100
  );
  const newContacts = [];
  for (let i = 0; i < contactCount; i++) {
    const ac = areaCodes[parseInt(i / 100, 10)];
    const suffix = String("00" + (i % 100)).slice(-2);
    newContacts.push({
      first_name: `Foo${i}`,
      last_name: `Bar${i}`,
      // conform to Hollywood-reserved numbers
      // https://www.businessinsider.com/555-phone-number-tv-movies-telephone-exchange-names-ghostbusters-2018-3
      cell: `+1${ac}555${suffix}`,
      zip: "10011",
      custom_fields: "{}",
      message_status: "needsMessage",
      campaign_id: campaignId
    });
  }
  await r.knex.batchInsert("campaign_contact", newContacts, 100);

  await completeContactLoad(
    job,
    null,
    // see failedContactLoad above for descriptions
    String(contactData.requestContactCount),
    JSON.stringify({ finalCount: contactCount })
  );
}
