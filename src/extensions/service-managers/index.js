import { getConfig } from "../../server/api/lib/config";

export function getServiceManagers(organization) {
  const handlerKey = "SERVICE_MANAGERS";
  const configuredHandlers = getConfig(handlerKey, organization);
  const enabledHandlers =
    (configuredHandlers && configuredHandlers.split(",")) || [];

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
  const resultArray = [];
  // explicitly process these in order in case the order matters
  for (let i = 0, l = funkyManagers.length; i < l; i++) {
    resultArray.push(
      await funkyManagers[i][funcName]({ organization, ...funcArgs })
    );
  }
  // NOTE: some methods pass a shared modifiable object, e.g. 'saveData'
  // that might be modified in-place, rather than the resultArray
  // being important.
  return resultArray;
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
