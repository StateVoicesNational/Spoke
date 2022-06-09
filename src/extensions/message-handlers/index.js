import { getConfig } from "../../server/api/lib/config";

export function getMessageHandlers(organization) {
  const handlerKey = "MESSAGE_HANDLERS";
  const configuredHandlers = getConfig(handlerKey, organization);
  const enabledHandlers =
    (configuredHandlers && configuredHandlers.split(",")) || [];

  if (typeof configuredHandlers === "undefined") {
    enabledHandlers.push("auto-optout", "outbound-unassign");
  }

  const handlers = [];
  enabledHandlers.forEach(name => {
    try {
      const c = require(`./${name}/index.js`);
      handlers.push(c);
    } catch (err) {
      console.error(
        `${handlerKey} failed to load message handler ${name} -- ${err}`
      );
    }
  });
  return handlers;
}

export function getHandlerDisplayName(name) {
  try {
    return require(`./${name}/index.js`).displayName();
  } catch (exception) {
    return "";
  }
}

export function getHandlerDescription(name) {
  try {
    const serverAdministratorInstructions = require(`./${name}/index.js`).serverAdministratorInstructions();
    return serverAdministratorInstructions.description;
  } catch (exception) {
    return "";
  }
}
