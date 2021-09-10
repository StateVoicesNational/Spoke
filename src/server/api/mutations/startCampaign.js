import { cacheableData } from "../../models";
import { accessRequired } from "../errors";
import { jobRunner } from "../../../extensions/job-runners";
import { Jobs } from "../../../workers/job-processes";

export const startCampaign = async (_, { id }, { user }) => {
  const campaign = await cacheableData.campaign.load(id);
  await accessRequired(user, campaign.organization_id, "ADMIN");

  // onCampaignStart service managers get to do stuff,
  // before we update campaign.is_started (see workers/jobs.js::startCampaign)
  const userLookupField = user.lookupField || "id";
  const job = await jobRunner.dispatchJob({
    queue_name: `${id}:start_campaign`,
    job_type: Jobs.START_CAMPAIGN,
    locks_queue: true,
    campaign_id: id,
    payload: {
      userLookupField,
      userLookupValue: user[userLookupField],
      organizationId: campaign.organization_id
    }
  });

  const updatedCampaign = await cacheableData.campaign.load(id);
  if (!updatedCampaign.is_started) {
    updatedCampaign.isStarting = true;
  }
  return updatedCampaign;
};
