import { completeContactLoad, failedContactLoad } from "../../../workers/jobs";
import { r, cacheableData } from "../../../server/models";
import { getConfig, hasConfig } from "../../../server/api/lib/config";
import queryString from "query-string";
import { getConversationFiltersFromQuery } from "../../../lib";
import { getConversations } from "../../../server/api/conversations";
import { getTags } from "../../../server/api/tag";

export const name = "past-contacts";

export function displayName() {
  return "Past Contacts";
}

export function serverAdministratorInstructions() {
  return {
    environmentVariables: [],
    description:
      "Pull contacts from past campaigns through a message review url, optionally also based on a question response.",
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
  return `${organization.id}-${campaign.id}`;
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

  const targetCampaignId = job.campaign_id;
  const contactData = JSON.parse(job.payload);

  const targetCampaign = await cacheableData.campaign.load(targetCampaignId);
  const organization = await cacheableData.organization.load(
    targetCampaign.organization_id
  );
  let minExtraFields = [];
  let extraFieldsNeedsScrubbing = false;

  let query = r
    .knex("campaign_contact")
    .join("campaign", "campaign_contact.campaign_id", "campaign.id")
    .where({
      is_opted_out: false,
      organization_id: organization.id // security to restrict by organization
    });

  if (contactData.pastContactsQuery) {
    contactData.pastContactsQuery = contactData.pastContactsQuery
      .split("?")
      .pop();

    const params = queryString.parse(contactData.pastContactsQuery);
    let organizationTags = [];
    if (params.tags) {
      organizationTags = await getTags(organization);
    }
    const filters = getConversationFiltersFromQuery(params, organizationTags);
    const ccIdQuery = await getConversations(
      { offset: 0 }, // don't limit FUTURE: maybe DO have a limit?
      organization.id,
      filters,
      null,
      false, // includeTags only matters without justIds
      null,
      { justIdQuery: true }
    );
    console.log(
      "contactData.pastContactsQuery",
      contactData.pastContactsQuery,
      params,
      ccIdQuery.toString()
    );
    const campaignExtraFieldsQuery = ccIdQuery.query.clone();
    const extraFields = await campaignExtraFieldsQuery
      .clearSelect()
      .select(
        "campaign_contact.campaign_id",
        r.knex.raw(
          "max(campaign_contact.custom_fields) as custom_fields_example"
        )
      )
      .groupBy("campaign_contact.campaign_id");
    if (extraFields.length > 1) {
      function intersection(o1, o2) {
        const res = o1.filter(a => o2.indexOf(a) !== -1);
        console.log("intersection", o1, o2, res);
        return res;
      }
      const firstFields = Object.keys(
        JSON.parse(extraFields[0].custom_fields_example)
      );
      minExtraFields = extraFields
        .map(o => Object.keys(JSON.parse(o.custom_fields_example)))
        .reduce(intersection, firstFields);
      console.log("extraFieldsScrubbing", extraFields, "min", minExtraFields);
      if (minExtraFields.length !== firstFields.length) {
        extraFieldsNeedsScrubbing = true;
      }
    }
    query.whereIn(
      "campaign_contact.id",
      ccIdQuery.query.clearSelect().select("campaign_contact.id")
    );
  }

  if (contactData.questionResponseAnswer) {
    query
      .join(
        "question_response",
        "question_response.campaign_contact_id",
        "campaign_contact.id"
      )
      .where({
        value: contactData.questionResponseAnswer
      });
  }

  await r
    .knex("campaign_contact")
    .where("campaign_id", targetCampaignId)
    .delete();

  const copyColumns = [
    "external_id",
    "first_name",
    "last_name",
    "cell",
    "zip",
    "custom_fields",
    "timezone_offset"
  ];

  // Based on https://github.com/knex/knex/issues/1323#issuecomment-331274931
  query = query.select(
    r.knex.raw("? AS ??", [targetCampaignId, "campaign_id"]),
    r.knex.raw("? AS ??", ["needsMessage", "message_status"]),
    ...copyColumns
  );
  const result = await r
    .knex(
      r.knex.raw("?? (??, ??, ??, ??, ??, ??, ??, ??, ??)", [
        "campaign_contact",
        "campaign_id",
        "message_status",
        ...copyColumns
      ])
    )
    .insert(query);

  await completeContactLoad(
    job,
    null,
    JSON.stringify(contactData),
    String(result.rowCount)
  );

  // This needs to be AFTER completeContactLoad
  // because we need the first record AFTER, not before, records get scrubbed
  if (extraFieldsNeedsScrubbing) {
    const firstContact = await r
      .knex("campaign_contact")
      .select("id", "campaign_id", "custom_fields")
      .where("campaign_id", targetCampaignId)
      .orderBy("id")
      .first();
    if (firstContact) {
      const firstContactFields = JSON.parse(firstContact.custom_fields);
      const finalFields = {};
      minExtraFields.forEach(f => {
        finalFields[f] = firstContactFields[f];
      });
      await r
        .knex("campaign_contact")
        .where("id", firstContact.id)
        .update({ custom_fields: JSON.stringify(finalFields) });
    }
  }
}
