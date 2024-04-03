import { getConfig } from "../../server/api/lib/config";

// Checks the gloabl var DYNAMICASSIGNMENT_BATCHES and
// whether the handler loads, similar to how texter-sideboxes works

// https://github.com/StateVoicesNational/Spoke/blob/main/docs/HOWTO-use-dynamicassignment-batches.md

export const getDynamicAssignmentBatchPolicies = ({
  organization,
  campaign
}) => {
  const handlerKey = "DYNAMICASSIGNMENT_BATCHES";
  const campaignEnabled = getConfig(handlerKey, campaign, { onlyLocal: true });
  const configuredHandlers =
    campaignEnabled ||
    getConfig(handlerKey, organization) ||
    [
      "finished-replies-tz",
      "vetted-texters",
      "finished-replies"
    ];
  const enabledHandlers =
    (configuredHandlers && configuredHandlers.split(",")) || [];
  if (!campaignEnabled) {
    // remove everything except the first one for non-campaign enabled choices
    enabledHandlers.splice(1);
  }

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
  console.log(handlers)
  return handlers;
};
