import { getConfig } from "../../server/api/lib/config";

export const getDynamicAssignmentBatchPolicies = ({
  organization,
  campaign
}) => {
  const handlerKey = "DYNAMICASSIGNMENT_BATCHES";
  const configuredHandlers =
    getConfig(handlerKey, campaign, { onlyLocal: true }) ||
    getConfig(handlerKey, organization) ||
    "finished-replies,vetted-texters";
  const enabledHandlers =
    (configuredHandlers && configuredHandlers.split(",")) || [];

  const handlers = [];
  enabledHandlers.forEach(name => {
    try {
      const c = require(`./${name}/index.js`);
      handlers.push(c);
    } catch (err) {
      console.error(
        `${handlerKey} failed to load dynamicassignment-batches handler ${name} -- ${err}`
      );
    }
  });
  return handlers;
};
