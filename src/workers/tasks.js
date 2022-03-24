// Tasks are lightweight, fire-and-forget functions run in the background.
// Unlike Jobs, tasks are not tracked in the database.
// See src/extensions/job-runners/README.md for more details
import serviceMap from "../extensions/service-vendors";
import * as ActionHandlers from "../extensions/action-handlers";
import { r, cacheableData } from "../server/models";
import { processServiceManagers } from "../extensions/service-managers";

export const Tasks = Object.freeze({
  ACTION_HANDLER_QUESTION_RESPONSE: "action_handler:question_response",
  ACTION_HANDLER_TAG_UPDATE: "action_handler:tag_update",
  ACTION_HANDLER_CANNED_RESPONSE: "action_handler:canned_response",
  CAMPAIGN_START_CACHE: "campaign_start_cache",
  EXTENSION_TASK: "extension_task",
  SEND_MESSAGE: "send_message",
  SERVICE_MANAGER_TRIGGER: "service_manager_trigger"
});

const serviceManagerTrigger = async ({
  functionName,
  organizationId,
  data
}) => {
  let organization;
  if (organizationId) {
    organization = await cacheableData.organization.load(organizationId);
  }
  const serviceManagerData = await processServiceManagers(
    functionName,
    organization,
    data
  );
};

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
  const serviceManagerData = await processServiceManagers(
    "onMessageSend",
    organization,
    { message, contact, campaign, service }
  );

  await service.sendMessage({
    message,
    contact,
    trx,
    organization,
    campaign,
    serviceManagerData
  });
};

const questionResponseActionHandler = async ({
  name,
  organization,
  user,
  questionResponse,
  interactionStep,
  campaign,
  contact,
  wasDeleted,
  previousValue
}) => {
  const handler = await ActionHandlers.rawActionHandler(name);

  if (!wasDeleted) {
    // TODO: clean up processAction interface
    return handler.processAction({
      actionObject: interactionStep,
      campaignContactId: contact.id,
      contact,
      campaign,
      organization,
      previousValue
    });
  } else if (
    handler.processDeletedQuestionResponse &&
    typeof handler.processDeletedQuestionResponse === "function"
  ) {
    return handler.processDeletedQuestionResponse({
      questionResponse,
      interactionStep,
      campaignContactId: contact.id,
      contact,
      campaign,
      organization,
      previousValue
    });
  }
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

const cannedResponseActionHandler = async ({
  cannedResponse,
  organization,
  campaign,
  contact
}) => {
  const handler = await ActionHandlers.rawActionHandler(
    cannedResponse.answer_actions
  );

  return handler.processAction({
    actionObject: cannedResponse,
    campaignContactId: contact.id,
    contact,
    campaign,
    organization
  });
};

const startCampaignCache = async ({ campaign, organization }, contextVars) => {
  // Refresh all the campaign data into cache
  // This should refresh/clear any corruption
  const loadAssignments = cacheableData.campaignContact.updateCampaignAssignmentCache(
    campaign.id
  );
  const loadContacts = cacheableData.campaignContact
    .loadMany(campaign, organization, contextVars || {})
    .then(() => {
      // eslint-disable-next-line no-console
      console.log("FINISHED contact loadMany", campaign.id);
    })
    .catch(err => {
      // eslint-disable-next-line no-console
      console.error("ERROR contact loadMany", campaign.id, err, campaign);
    });
  const loadOptOuts = cacheableData.optOut.loadMany(organization.id);

  await loadAssignments;
  await loadContacts;
  await loadOptOuts;
};

const extensionTask = async (taskData, contextVars) => {
  if (taskData.path && taskData.method) {
    const extension = require("../" + taskData.path);
    if (extension && typeof extension[taskData.method] === "function") {
      await extension[taskData.method](taskData, contextVars);
    }
  }
};

const taskMap = Object.freeze({
  [Tasks.ACTION_HANDLER_QUESTION_RESPONSE]: questionResponseActionHandler,
  [Tasks.ACTION_HANDLER_TAG_UPDATE]: tagUpdateActionHandler,
  [Tasks.ACTION_HANDLER_CANNED_RESPONSE]: cannedResponseActionHandler,
  [Tasks.CAMPAIGN_START_CACHE]: startCampaignCache,
  [Tasks.EXTENSION_TASK]: extensionTask,
  [Tasks.SEND_MESSAGE]: sendMessage,
  [Tasks.SERVICE_MANAGER_TRIGGER]: serviceManagerTrigger
});

export const invokeTaskFunction = async (taskName, payload) => {
  if (taskName in taskMap) {
    await taskMap[taskName](payload);
  } else {
    throw new Error(`Task of type ${taskName} not found`);
  }
};
