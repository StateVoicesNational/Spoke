// Tasks are lightweight, fire-and-forget functions run in the background.
// Unlike Jobs, tasks are not tracked in the database.
// See src/integrations/job-runners/README.md for more details
import serviceMap from "../server/api/lib/services";
import * as ActionHandlers from "../integrations/action-handlers";

export const Tasks = Object.freeze({
  SEND_MESSAGE: "send_message",
  ACTION_HANDLER_QUESTION_RESPONSE: "action_handler:question_response",
  ACTION_HANDLER_TAG_UPDATE: "action_handler:tag_update",
  MESSAGE_HANDLER_POST_SAVE: "message_handler:post_save"
  // TODO:
  // NOTIFICATION: "NOTIFICATION"
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
  interactionStepAction,
  organization,
  user,
  questionResponse,
  questionResponseInteractionStep,
  campaign,
  contact
}) => {
  const handler = await ActionHandlers.getActionHandler(
    interactionStepAction,
    organization,
    user
  );
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
  tags,
  user,
  contact,
  campaign,
  organization
}) => {
  const handlers = await ActionHandlers.getActionHandlersAvailableForTagUpdate(
    organization,
    user
  );
  await Promise.all(
    handlers.map(async handler => {
      await handler.onTagUpdate(tags, user, contact, campaign, organization);
    })
  );
};

// const invokeMessageHandlerPostSave = async ({ name, postSaveData }) => {};

const taskMap = Object.freeze({
  [Tasks.SEND_MESSAGE]: sendMessage,
  [Tasks.ACTION_HANDLER_QUESTION_RESPONSE]: questionResponseActionHandler,
  [Tasks.ACTION_HANDLER_TAG_UPDATE]: tagUpdateActionHandler
  // [Tasks.MESSAGE_HANDLER_POST_SAVE]: invokeMessageHandlerPostSave
});

export const invokeTaskFunction = async (taskName, payload) => {
  if (taskName in taskMap) {
    await taskMap[taskName](payload);
  } else {
    throw new Error(`Task of type ${taskName} not found`);
  }
};
