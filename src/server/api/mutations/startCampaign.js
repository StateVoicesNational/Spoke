import { cacheableData } from "../../models";
import { accessRequired } from "../errors";
import { getConfig } from "../lib/config";
import { jobRunner } from "../../../extensions/job-runners";
import { Tasks } from "../../../workers/tasks";

export const startCampaign = async (_, { id }, { user }) => {
  const campaign = await cacheableData.campaign.load(id);
  await accessRequired(user, campaign.organization_id, "ADMIN");
  const organization = await cacheableData.organization.load(
    campaign.organization_id
  );

  // onCampaignStart service managers get to do stuff,
  // before we update campaign.is_started (see workers/tasks.js::serviceManagerTrigger)
  await jobRunner.dispatchTask(Tasks.SERVICE_MANAGER_TRIGGER, {
    functionName: "onCampaignStart",
    organizationId: organization.id,
    data: {
      campaign,
      user
    }
  });
  return campaign;
  // TODO: maybe return a isStarting for component update
};
