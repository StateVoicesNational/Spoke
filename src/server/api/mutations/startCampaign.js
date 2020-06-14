import cacheableData from "../../models/cacheable_queries";
import { r } from "../../models";
import { accessRequired } from "../errors";
import { Notifications, sendUserNotification } from "../../notifications";
import { loadCampaignCache, startCampaignAsync } from "../../../workers/jobs";
import twilio from "../lib/twilio";
import { getConfig } from "../lib/config";

const JOBS_SAME_PROCESS = !!(
  process.env.JOBS_SAME_PROCESS || global.JOBS_SAME_PROCESS
);

export const startCampaign = async (
  _,
  { id },
  { user, loaders, remainingMilliseconds }
) => {
  const campaign = await cacheableData.campaign.load(id);
  await accessRequired(user, campaign.organization_id, "ADMIN");
  const organization = await loaders.organization.load(
    campaign.organization_id
  );

  if (
    getConfig("EXPERIMENTAL_CAMPAIGN_PHONE_NUMBERS", null, {
      truthy: true
    })
  ) {
    if (!JOBS_SAME_PROCESS) {
      throw Error(
        "EXPERIMENTAL_CAMPAIGN_PHONE_NUMBERS only supports JOBS_SAME_PROCESS"
      );
    }
    // Transferring numbers in twilio can take a long time, so start campaign becomes a job
    const job = await r.knex.transaction(async trx => {
      // TODO: get this working on SQLite?
      // prevent duplicate start jobs for the same campaign
      await trx.raw("LOCK TABLE job_request IN EXCLUSIVE MODE");
      const existing = await trx("job_request")
        .select("*")
        .where({ campaign_id: id, job_type: "start_campaign" })
        .first();
      if (existing) {
        throw new Error("Duplicate start campaign job");
      }
      return trx("job_request")
        .insert({
          queue_name: `${id}:start_campaign`,
          job_type: "start_campaign",
          locks_queue: false,
          assigned: true,
          campaign_id: id,
          payload: JSON.stringify({})
        })
        .returning("*");
    });

    console.log("Kicked off start_campaign job", job[0]);
    // TODO: move to job dispatch function
    startCampaignAsync(job[0]); // JOB_SAME_PROCESS no await

    return await cacheableData.campaign.load(id, {
      forceLoad: true
    });
  }

  if (campaign.use_own_messaging_service) {
    if (!campaign.messageservice_sid) {
      const friendlyName = `Campaign: ${campaign.title} (${campaign.id}) [${process.env.BASE_URL}]`;
      const messagingService = await twilio.createMessagingService(
        organization,
        friendlyName
      );
      campaign.messageservice_sid = messagingService.sid;
    }
  } else {
    campaign.messageservice_sid = await cacheableData.organization.getMessageServiceSid(
      organization
    );
  }

  campaign.is_started = true;

  await campaign.save();
  await sendUserNotification({
    type: Notifications.CAMPAIGN_STARTED,
    campaignId: id
  });

  const campaignRefreshed = await cacheableData.campaign.load(id, {
    forceLoad: true
  });

  // some asynchronous cache-priming:
  await loadCampaignCache(campaignRefreshed, organization, {
    remainingMilliseconds
  });
  return campaignRefreshed;
};
