import { getHandlers } from "./get-handlers";

export const processMessage = messageInstance => {
  let latestMessageInstance = messageInstance;

  // every calls each handler
  // it stops if one of the handlers returns something falsy
  getHandlers().every(async handler => {
    latestMessageInstance = await handler.processMessage(latestMessageInstance);
    return latestMessageInstance;
  });
};
