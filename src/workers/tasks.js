// Tasks are lightweight, fire-and-forget functions run in the background.
// Unlike Jobs, tasks are not tracked in the database.
// See src/integrations/job-runners/README.md for more details
import serviceMap from "../server/api/lib/services";
import * as ActionHandlers from "../integrations/action-handlers";
import { cacheableData } from "../server/models";

export const Tasks = Object.freeze({
  SEND_MESSAGE: "send_message",
  ACTION_HANDLER_QUESTION_RESPONSE: "action_handler:question_response",
  ACTION_HANDLER_TAG_UPDATE: "action_handler:tag_update",
  CAMPAIGN_START_CACHE: "campaign_start_cache"
});

const sendMessage = async ({
  message,
  contact,
  trx,
  organization,
  campaign
}) => {
  const service = serviceMap[message.service];
  if (!service) {
    throw new Error(`Failed to find service for message ${message}`);
  }

  await service.sendMessage(message, contact, trx, organization, campaign);
};

const questionResponseActionHandler = async ({
  name,
  organization,
  questionResponse,
  questionResponseInteractionStep,
  campaign,
  contact
}) => {
  const handler = await ActionHandlers.rawActionHandler(name);
  // TODO: clean up processAction interface
  await handler.processAction(
    questionResponse,
    questionResponseInteractionStep,
    contact.id,
    contact,
    campaign,
    organization
  );
};

const tagUpdateActionHandler = async ({
  name,
  tags,
  contact,
  campaign,
  organization,
  texter
}) => {
  const handler = await ActionHandlers.rawActionHandler(name);
  await handler.onTagUpdate(tags, contact, campaign, organization, texter);
};

const startCampaignCache = async ({ campaign, organization }) => {
  // Refresh all the campaign data into cache
  // This should refresh/clear any corruption
  console.log("loadCampaignCache async tasks...", campaign.id);
  const loadAssignments = cacheableData.campaignContact.updateCampaignAssignmentCache(
    campaign.id
  );
  const loadContacts = cacheableData.campaignContact
    .loadMany(campaign, organization, {})
    .then(() => {
      console.log("FINISHED contact loadMany", campaign.id);
    })
    .catch(err => {
      console.error("ERROR contact loadMany", campaign.id, err, campaign);
    });
  const loadOptOuts = cacheableData.optOut.loadMany(organization.id);

  await loadAssignments;
  await loadContacts;
  await loadOptOuts;
};

const taskMap = Object.freeze({
  [Tasks.SEND_MESSAGE]: sendMessage,
  [Tasks.ACTION_HANDLER_QUESTION_RESPONSE]: questionResponseActionHandler,
  [Tasks.ACTION_HANDLER_TAG_UPDATE]: tagUpdateActionHandler,
  [Tasks.CAMPAIGN_START_CACHE]: startCampaignCache
});

export const invokeTaskFunction = async (taskName, payload) => {
  if (taskName in taskMap) {
    await taskMap[taskName](payload);
  } else {
    throw new Error(`Task of type ${taskName} not found`);
  }
};
