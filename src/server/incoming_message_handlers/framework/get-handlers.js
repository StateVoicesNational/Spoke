import * as fs from "fs";
import * as path from "path";

const handlerDirectoryPath = "src/server/incoming_message_handlers";

const makeHandlerPath = handlerFileName =>
  `${handlerDirectoryPath}/${handlerFileName}.js`;

const getSpecifiedHandlers = () => {
  if (process.env.MESSAGE_HANDLERS) {
    const specifiedHandlers = JSON.parse(process.env.MESSAGE_HANDLERS);
    const specifiedHandlersSet = new Set(specifiedHandlers);
    if (specifiedHandlers.length !== specifiedHandlersSet.size) {
      throw new Error("MESSAGE_HANDLERS not a distinct list");
    }
    if (!specifiedHandlers.includes("save-message")) {
      throw new Error("MESSAGE_HANDLERS must include save-message");
    }
    return specifiedHandlers;
  }

  return ["save-message"];
};

const loadHandlers = () =>
  getSpecifiedHandlers().map(handlerName => {
    let handler;
    try {
      handler = require(path.resolve(makeHandlerPath(handlerName))); // eslint-disable-line global-require
    } catch (e) {
      throw new Error(`Failed to load handler ${handlerName}: ${e}`);
    }
    if (typeof handler.processMessage !== "function") {
      throw new Error(
        `Handler ${handlerName} does not expose processMessage function`
      );
    }
    return handler;
  });

let handlers;
export const getHandlers = () => {
  if (!handlers) {
    handlers = loadHandlers();
  }

  return handlers;
};
