import { getConfig } from "../../server/api/lib/config";

export function getServiceManagers(organization) {
  const handlerKey = "SERVICE_MANAGERS";
  const configuredHandlers = getConfig(handlerKey, organization);
  const enabledHandlers =
    (configuredHandlers && configuredHandlers.split(",")) || [];
  const orgService = getConfig("service", organization);
  const twilioAccountSwitchingIdx = enabledHandlers.indexOf(
    "twilio-account-switching"
  );

  if (
    typeof configuredHandlers === "undefined" &&
    getConfig(
      "EXPERIMENTAL_TWILIO_PER_CAMPAIGN_MESSAGING_SERVICE",
      organization,
      { truthy: 1 }
    )
  ) {
    enabledHandlers.push("per-campaign-messageservices");
  }

  // Disable Twilio Account Switching if organization service is defined as something else besides "twilio"
  if (
    twilioAccountSwitchingIdx > -1 &&
    orgService !== undefined &&
    orgService != "twilio"
  ) {
    enabledHandlers.splice(twilioAccountSwitchingIdx, 1);
  }

  const handlers = [];
  enabledHandlers.forEach(name => {
    try {
      const c = require(`./${name}/index.js`);
      handlers.push(c);
    } catch (err) {
      console.error(
        `${handlerKey} failed to load service manager ${name} -- ${err}`
      );
    }
  });
  return handlers;
}

export function serviceManagersHaveImplementation(funcName, organization) {
  // in-case funcArgs or organization is an additional 'hit' in a fast-path
  // then call this method first to make sure it's worth loading extra context
  // before calling processServiceManagers
  const managers = getServiceManagers(organization);
  return managers.filter(m => typeof m[funcName] === "function").length;
}

export async function processServiceManagers(
  funcName,
  organization,
  funcArgs,
  specificServiceManagerName
) {
  const managers = getServiceManagers(organization);
  const funkyManagers = managers.filter(
    m =>
      typeof m[funcName] === "function" &&
      (!specificServiceManagerName || m.name === specificServiceManagerName)
  );
  const serviceManagerData = {};
  // Explicitly process these in order in case the order matters
  // Current serviceManagerData state is passed along, so a later serviceManager
  //   can decide to do something if a previous one hasn't yet.
  for (let i = 0, l = funkyManagers.length; i < l; i++) {
    const result = await funkyManagers[i][funcName]({
      organization,
      serviceManagerData,
      ...funcArgs
    });
    if (result) {
      Object.assign(serviceManagerData, result);
    }
  }
  // NOTE: some methods pass a shared modifiable object, e.g. 'saveData'
  // that might be modified in-place, rather than the resultArray
  // being important.
  return serviceManagerData;
}

export async function getServiceManagerData(
  funcName,
  organization,
  funcArgs,
  specificServiceManagerName
) {
  const managers = getServiceManagers(organization);
  const funkyManagers = managers.filter(
    m =>
      typeof m[funcName] === "function" &&
      (!specificServiceManagerName || m.name === specificServiceManagerName)
  );
  const resultArray = await Promise.all(
    funkyManagers.map(async sm => ({
      name: sm.name,
      ...sm.metadata(),
      ...(await sm[funcName]({ organization, ...funcArgs }))
    }))
  );
  return resultArray;
}
