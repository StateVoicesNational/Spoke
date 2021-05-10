import cacheableData from "../../models/cacheable_queries";
import { r } from "../../models";
import { accessRequired } from "../errors";
import { Notifications, sendUserNotification } from "../../notifications";
import { serviceManagersHaveImplementation } from "../../../extensions/service-managers";
import * as twilio from "../../../extensions/service-vendors/twilio";
import { getConfig } from "../lib/config";
import { jobRunner } from "../../../extensions/job-runners";
import { Tasks } from "../../../workers/tasks";
import { Jobs } from "../../../workers/job-processes";

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
    getConfig("EXPERIMENTAL_CAMPAIGN_PHONE_NUMBERS", organization, {
      truthy: true
    })
  ) {
    await jobRunner.dispatchJob({
      queue_name: `${id}:start_campaign`,
      job_type: Jobs.START_CAMPAIGN_WITH_PHONE_NUMBERS,
      locks_queue: false,
      campaign_id: id,
      payload: JSON.stringify({})
    });

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
  const campaignRefreshed = await cacheableData.campaign.load(id, {
    forceLoad: true
  });
  await sendUserNotification({
    type: Notifications.CAMPAIGN_STARTED,
    campaignId: id
  });

  if (r.redis && !getConfig("DISABLE_CONTACT_CACHELOAD")) {
    // some asynchronous cache-priming:
    await jobRunner.dispatchTask(Tasks.CAMPAIGN_START_CACHE, {
      campaign: campaignRefreshed,
      organization
    });
  }

  if (serviceManagersHaveImplementation("onCampaignStart", organization)) {
    await jobRunner.dispatchTask(Tasks.SERVICE_MANAGER_TRIGGER, {
      functionName: "onCampaignStart",
      organizationId: organization.id,
      data: {
        campaign: campaignRefreshed,
        user
      }
    });
  }
  return campaignRefreshed;
};
