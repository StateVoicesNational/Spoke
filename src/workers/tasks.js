import serviceMap from "../server/api/lib/services";

// Tasks are lightweight, fire-and-forget functions run in the background.
// Unlike Jobs, tasks are not tracked in the database.
// See src/integrations/job-runners/README.md for more details

export const Tasks = Object.freeze({
  SEND_MESSAGE: "SEND_MESSAGE",
  ACTION_HANDLER: "ACTION_HANDLER",
  MESSAGE_HANDLER_POST_SAVE: "MESSAGE_HANDLER_POST_SAVE"
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

const invokeActionHandler = async ({ name, actionHandlerData }) => {};

const invokeMessageHandlerPostSave = async ({ name, postSaveData }) => {};

const taskMap = Object.freeze({
  [Tasks.SEND_MESSAGE]: sendMessage,
  [Tasks.ACTION_HANDLER]: invokeActionHandler,
  [Tasks.MESSAGE_HANDLER_POST_SAVE]: invokeMessageHandlerPostSave
});

export const invokeTaskFunction = async (taskName, payload) => {
  if (taskName in taskMap) {
    await taskMap[taskName](payload);
  } else {
    throw new Error(`Task of type ${taskName} not found`);
  }
};
