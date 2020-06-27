import { getConfig } from "../../server/api/lib/config";
import campaignCache from "../../server/models/cacheable_queries/campaign";

export const getMessageHandlers = organization => {
  const handlerKey = "MESSAGE_HANDLERS";
  const configuredHandlers = getConfig(handlerKey, organization);
  const enabledHandlers =
    (configuredHandlers && configuredHandlers.split(",")) || [];

  const handlers = [];
  enabledHandlers.forEach(name => {
    try {
      // eslint-disable-next-line global-require
      const c = require(`./${name}/index.js`);
      handlers.push(c);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        `${handlerKey} failed to load message handler ${name} -- ${err}`
      );
    }
  });
  return handlers;
};

const getAvailableHandlers = async (
  { organization: organizationInput, campaignId },
  requiredMethods
) => {
  let organization = organizationInput;
  if (!organization) {
    organization = await campaignCache.loadCampaignOrganization({
      campaignId
    });
  }

  const isHandlerAvailable = async handler =>
    !!handler.available &&
    requiredMethods.every(requiredMethod => !!handler[requiredMethod]) &&
    (await handler.available(organization)) &&
    handler;

  const handlers = getMessageHandlers(organization);
  const promises = handlers.map(handler => isHandlerAvailable(handler));
  const resolved = await Promise.all(promises);
  return resolved.filter(handler => !!handler);
};

export const getAvailablePostMessageSaveHandlers = async parameters => {
  return getAvailableHandlers(parameters, ["postMessageSave"]);
};

export const getAvailablePreMessageSaveHandlers = async parameters => {
  return getAvailableHandlers(parameters, ["preMessageSave"]);
};
