import { getConfig } from "../../server/api/lib/config";

export function getMessageHandlers(organization) {
  const handlerKey = "MESSAGE_HANDLERS";
  const configuredHandlers = getConfig(handlerKey, organization);
  const enabledHandlers =
    (configuredHandlers && configuredHandlers.split(",")) || [];

  const handlers = {};
  enabledHandlers.forEach(name => {
    try {
      const c = require(`./${name}/index.js`);
      handlers[name] = c;
    } catch (err) {
      console.error(
        `${handlerKey} failed to load message handler ${name} -- ${err}`
      );
    }
  });
  return handlers;
}
