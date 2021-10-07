import _ from "lodash";
import { r, cacheableData } from "../../../server/models";
import { getConfig, getFeatures } from "../../../server/api/lib/config";
import { Jobs } from "../../../workers/job-processes";
import { Tasks } from "../../../workers/tasks";
import { jobRunner } from "../../job-runners";
import { getServiceFromOrganization } from "../../service-vendors";
/// All functions are OPTIONAL EXCEPT metadata() and const name=.
/// DO NOT IMPLEMENT ANYTHING YOU WILL NOT USE -- the existence of a function adds behavior/UI (sometimes costly)

/// TODO
// 1. contactsCount=0 should also block clicking on the lookup
// 2. react component

export const name = "scrub-bad-mobilenums";

export const metadata = () => ({
  // set canSpendMoney=true, if this extension can lead to (additional) money being spent
  // if it can, which operations below can trigger money being spent?
  displayName: "Scrub numbers that aren't mobile numbers (with lookup)",
  description:
    "When the campaign admin clicks to lookup numbers, all numbers will be looked up and any that are landlines will be removed (and remembered)",
  canSpendMoney: true,
  moneySpendingOperations: ["onCampaignUpdateSignal"],
  supportsOrgConfig: false,
  supportsCampaignConfig: true
});

const lookupQuery = (campaignId, organizationId) => {
  let query = r
    .knex("campaign_contact")
    .leftJoin(
      "organization_contact",
      "organization_contact.contact_number",
      "campaign_contact.cell"
    )
    .where({
      campaign_id: campaignId,
      message_status: "needsMessage"
    })
    .where(function() {
      this.whereNull("status_code") // no entry
        .orWhere("status_code", 0); // unknown status
    });
  if (!getConfig("OPTOUTS_SHARE_ALL_ORGS")) {
    query = query.where(function() {
      // FUTURE: consider leveraging other organizations
      // challenge 1: might get contact_number dupes w/o it
      // challenge 2: need to insert instead of update
      this.whereNull("organization_id").orWhere(
        "organization_id",
        organizationId
      );
    });
  }
  return query;
};

const deleteLandlineContacts = campaignId =>
  r
    .knex("campaign_contact")
    .whereIn(
      "id",
      r
        .knex("campaign_contact")
        .select("campaign_contact.id")
        .join(
          "organization_contact",
          "organization_contact.contact_number",
          "campaign_contact.cell"
        )
        .where("campaign_id", campaignId)
        .where("status_code", "<", 0) // landlines and other non-textables
    )
    .where("campaign_contact.campaign_id", campaignId)
    .delete();

export async function getCampaignData({
  organization,
  campaign,
  user,
  loaders,
  fromCampaignStatsPage
}) {
  // MUST NOT RETURN SECRETS!
  // called both from edit and stats contexts: editMode==true for edit page
  if (!fromCampaignStatsPage) {
    const features = getFeatures(campaign);
    const {
      scrubBadMobileNumsFreshStart = false,
      scrubBadMobileNumsFinished = false,
      scrubBadMobileNumsFinishedCount = null,
      scrubBadMobileNumsFinishedDeleteCount = null,
      scrubBadMobileNumsDeletedOnUpload = null
    } = features;

    const scrubMobileOptional = getConfig(
      "SCRUB_MOBILE_OPTIONAL",
      organization
    );
    const serviceClient = getServiceFromOrganization(organization);
    const scrubBadMobileNumsGettable =
      typeof serviceClient.getContactInfo === "function";
    let scrubBadMobileNumsCount = null;
    if (
      scrubBadMobileNumsGettable &&
      !scrubBadMobileNumsFreshStart &&
      !scrubBadMobileNumsFinished
    ) {
      scrubBadMobileNumsCount = await r.getCount(
        lookupQuery(campaign.id, organization.id)
      );
    }
    return {
      data: {
        scrubBadMobileNumsFreshStart,
        scrubBadMobileNumsFinished,
        scrubBadMobileNumsFinishedCount,
        scrubBadMobileNumsGettable,
        scrubBadMobileNumsCount,
        scrubBadMobileNumsFinishedDeleteCount,
        scrubBadMobileNumsDeletedOnUpload,
        scrubMobileOptional
      },
      fullyConfigured:
        scrubBadMobileNumsFinished ||
        scrubBadMobileNumsCount === 0 ||
        scrubMobileOptional
    };
  }
}

export async function processJobNumberLookups(job, payload) {
  // called async from onCampaignUpdateSignal
  console.log(
    "scrub-bad-mobilenums.processJobNumberLookups",
    job,
    payload,
    "organization",
    job.organization_id
  );
  // maxes out in 15min for around 20K contacts, we we recycle tasks from that time.
  await jobRunner.dispatchTask(Tasks.EXTENSION_TASK, {
    method: "nextBatchJobLookups",
    path: "extensions/service-managers/scrub-bad-mobilenums",
    job,
    lookupCount: payload.lookupCount,
    steps: 0,
    lastCount: payload.lookupCount
  });
}

export async function nextBatchJobLookups({
  job,
  lookupCount,
  steps,
  lastCount
}) {
  // called async from processJobNumberLookups which in-turn is called by onCampaignUpdateSignal
  console.log(
    "scrub-bad-mobilenums.nextBatchJobLookups",
    job,
    "organization",
    job.organization_id,
    steps,
    lastCount,
    lookupCount
  );
  const jobStillExists = await r
    .knex("job_request")
    .where("id", job.id)
    .first();
  if (!jobStillExists) {
    console.log("scrub-bad-mobilenums aborted job", job.id);
    return;
  }

  const organization = await cacheableData.organization.load(
    job.organization_id
  );
  const serviceClient = getServiceFromOrganization(organization);
  if (!serviceClient.getContactInfo) {
    return;
  }
  // 1. find all numbers that haven't already been looked up
  const contacts = await lookupQuery(
    job.campaign_id,
    job.organization_id
  ).select("cell", "last_lookup", "organization_contact.id", "organization_id");

  if (contacts.length === 0 || (steps > 0 && lastCount === contacts.length)) {
    // FINISHED: either no more to process or we are not making progress

    // actually delete/clear the campaign's landline contacts
    const deletedCount = await deleteLandlineContacts(job.campaign_id);

    await cacheableData.campaign.setFeatures(job.campaign_id, {
      scrubBadMobileNumsFinished: true,
      scrubBadMobileNumsFinishedCount: contacts.length,
      scrubBadMobileNumsFinishedDeleteCount: deletedCount
    });
    await r
      .knex("job_request")
      .where("id", job.id)
      .delete();
    console.log(
      "scrub-bad-mobilenums finsihed job",
      job.id,
      job.organization_id,
      contacts.length,
      lastCount,
      steps
    );
    return; // END FINSIHED
  }

  // Do 100 at a time, so we don't lose our work if it dies early
  const chunkSize = 200;
  const chunks = _.chunk(contacts, chunkSize);
  // maxes out in 15min for around 20K contacts, we we recycle tasks from that time.
  const maxChunksToProcessThisTime = Math.min(
    chunks.length,
    Math.ceil(20000 / chunkSize)
  );
  for (let i = 0; i < maxChunksToProcessThisTime; i++) {
    const chunk = chunks[i];
    const lookupChunk = await Promise.all(
      chunk.map(async contact => {
        // console.log("scrub.lookupChunk", contact);
        const info = await serviceClient.getContactInfo({
          organization,
          contactNumber: contact.cell
        });
        // console.log('scrub-bad-mobilenums lookup result', info);
        return {
          ...contact,
          ...info
        };
      })
    );
    const orgContacts = lookupChunk.map(
      ({ id, cell, status_code, carrier, lookup_name, last_error_code }) => ({
        id,
        organization_id: job.organization_id,
        contact_number: cell,
        status_code,
        last_error_code,
        lookup_name,
        carrier,
        last_lookup: new Date()
      })
    );
    const newLookups = orgContacts.filter(data => !data.id && data.status_code);
    // only send service for new lookups since old ones might have services connected to user_numbers
    const service = serviceClient.getMetadata().name;
    if (newLookups.length) {
      await r.knex("organization_contact").insert(
        newLookups.map(d => ({
          ...d,
          service,
          id: undefined
        }))
      );
    }

    const orgContactUpdates = orgContacts.filter(
      data => data.id && data.status_code
    );
    if (orgContactUpdates.length) {
      await r
        .knex("organization_contact")
        .insert(orgContactUpdates)
        .onConflict("organization_id", "contact_number")
        .merge();
    }
    await r
      .knex("job_request")
      .where("id", job.id)
      .update({ status: Math.ceil((100 * (i * chunkSize + 1)) / lookupCount) });
  }

  await jobRunner.dispatchTask(Tasks.EXTENSION_TASK, {
    method: "nextBatchJobLookups",
    path: "extensions/service-managers/scrub-bad-mobilenums",
    job,
    lookupCount,
    steps: steps + 1,
    lastCount: contacts.length
  });
}

export async function onCampaignUpdateSignal({
  organization,
  campaign,
  user,
  updateData,
  fromCampaignStatsPage
}) {
  const features = getFeatures(campaign);
  const service = getServiceFromOrganization(organization);
  if (typeof service.getContactInfo !== "function") {
    return;
  }

  const lookupCount = await r.getCount(
    lookupQuery(campaign.id, campaign.organization_id)
  );

  const job = await jobRunner.dispatchJob({
    queue_name: `${organization.id}:number_lookup`,
    result_message: "Srubbing Bad Mobile Nums: Processing",
    job_type: Jobs.EXTENSION_JOB,
    locks_queue: true,
    campaign_id: campaign.id,
    organization_id: campaign.organization_id,
    // NOTE: stringifying because compressedString is a binary buffer
    payload: JSON.stringify({
      method: "processJobNumberLookups",
      path: "extensions/service-managers/scrub-bad-mobilenums",
      lookupCount
    })
  });
  await cacheableData.campaign.setFeatures(campaign.id, {
    scrubBadMobileNumsFreshStart: false
  });

  return {
    data: {
      scrubBadMobileNumsProcessing: 1
    },
    fullyConfigured: false,
    startPolling: true
  };
}

export async function onCampaignContactLoad({
  organization,
  campaign,
  ingestResult,
  ingestDataReference,
  finalContactCount,
  deleteOptOutCells
}) {
  // 1. Clear features if it was set (i.e. they need to re-run it)
  await cacheableData.campaign.setFeatures(campaign.id, {
    scrubBadMobileNumsFinished: false,
    scrubBadMobileNumsFreshStart: true,
    scrubBadMobileNumsFinishedCount: null
  });

  // 2. Delete known landlines
  const deletedCount = await deleteLandlineContacts(campaign.id);

  console.log("Landline removal result", campaign.id, deletedCount);
  await cacheableData.campaign.setFeatures(campaign.id, {
    scrubBadMobileNumsDeletedOnUpload: deletedCount
  });
}
