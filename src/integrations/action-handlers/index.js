import { getConfig } from "../../server/api/lib/config";
import { r } from "../../server/models";
import { log } from "../../lib";
import _ from "lodash";

export const availabilityCacheKey = (name, organization, userId) =>
  `${getConfig("CACHE_PREFIX", organization) || ""}action-avail-${name}-${
    organization.id
  }-${userId}`;

export const choiceDataCacheKey = (name, organization, suffix) =>
  `${getConfig("CACHE_PREFIX", organization) ||
    ""}action-choices-${name}-${suffix}`;

// TODO: organization is never actually passed to this method so action handlers
//   are not actually configurable at the organization level
export function getActionHandlers(organization) {
  const enabledActionHandlers = (
    getConfig("ACTION_HANDLERS", organization) ||
    "test-action,complex-test-action"
  ).split(",");

  const actionHandlers = {};
  enabledActionHandlers.forEach(name => {
    try {
      const c = require(`./${name}.js`);
      actionHandlers[name] = c;
    } catch (err) {
      log.error(
        `ACTION_HANDLERS failed to load actionhandler ${name} -- ${err}`
      );
    }
  });
  return actionHandlers;
}

const CONFIGURED_ACTION_HANDLERS = getActionHandlers();
const CONFIGURED_TAG_HANDLERS = _.pickBy(
  CONFIGURED_ACTION_HANDLERS,
  handler => !!handler.onTagUpdate
);

export async function getSetCacheableResult(cacheKey, fallbackFunc) {
  if (r.redis && cacheKey) {
    const cacheRes = await r.redis.getAsync(cacheKey);
    if (cacheRes) {
      return JSON.parse(cacheRes);
    }
  }
  const slowRes = await fallbackFunc();
  if (r.redis && cacheKey && slowRes && slowRes.expiresSeconds) {
    await r.redis
      .multi()
      .set(cacheKey, JSON.stringify(slowRes))
      .expire(cacheKey, slowRes.expiresSeconds)
      .execAsync();
  }
  return slowRes;
}

function validate(actionHandler, toValidate) {
  const errors = [];
  toValidate.forEach(({ name, type }) => {
    if (typeof actionHandler[name] !== type) {
      errors.push(name);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Missing required exports ${JSON.stringify(errors)}`);
  }
}

export function validateActionHandler(actionHandler) {
  const toValidate = [
    { name: "name", type: "string" },
    { name: "available", type: "function" },
    { name: "processAction", type: "function" },
    { name: "displayName", type: "function" },
    { name: "instructions", type: "function" },
    { name: "serverAdministratorInstructions", type: "function" }
  ];

  validate(actionHandler, toValidate);
}

export function validateActionHandlerWithClientChoices(actionHandler) {
  const toValidate = [
    { name: "clientChoiceDataCacheKey", type: "function" },
    { name: "getClientChoiceData", type: "function" }
  ];

  validate(actionHandler, toValidate);
}
export async function getActionHandlerAvailability(
  name,
  actionHandler,
  organization,
  user
) {
  const fallbackFunction = async (_actionHandler, _organization, _user) => {
    exports.validateActionHandler(_actionHandler);
    return actionHandler.available(_organization, _user);
  };

  try {
    return (
      await getSetCacheableResult(
        availabilityCacheKey(name, organization, user.id),
        () => fallbackFunction(actionHandler, organization, user)
      )
    ).result;
  } catch (caughtError) {
    const message = `FAILED TO POLL AVAILABILITY from action handler ${name}. ${caughtError}`;
    log.error(message);
    return false;
  }
}

export function rawActionHandler(name) {
  return CONFIGURED_ACTION_HANDLERS[name];
}

export function rawAllActionHandlers() {
  return CONFIGURED_ACTION_HANDLERS;
}

// TODO: clean up tag update API. Because tag update handlers are _always_ run if configured
//   it would be better to separate tag handler integrations from question response handlers
export function rawAllTagUpdateActionHandlerNames() {
  return Object.keys(CONFIGURED_TAG_HANDLERS);
}

export async function getActionHandler(name, organization, user) {
  let isAvail;
  if (name in CONFIGURED_ACTION_HANDLERS) {
    isAvail = await getActionHandlerAvailability(
      name,
      CONFIGURED_ACTION_HANDLERS[name],
      organization,
      user
    );
  }
  return !!isAvail && CONFIGURED_ACTION_HANDLERS[name];
}

export async function getAvailableActionHandlers(organization, user) {
  const actionHandlers = await Promise.all(
    Object.keys(CONFIGURED_ACTION_HANDLERS).map(name =>
      getActionHandler(name, organization, user)
    )
  );
  return actionHandlers.filter(x => x);
}

export async function getActionChoiceData(actionHandler, organization, user) {
  const cacheKeyFunc =
    actionHandler.clientChoiceDataCacheKey || (org => `${org.id}`);
  const clientChoiceDataFunc =
    actionHandler.getClientChoiceData || (() => ({ data: "{}" }));

  let cacheKey;
  try {
    cacheKey = exports.choiceDataCacheKey(
      actionHandler.name,
      organization,
      cacheKeyFunc(organization, user)
    );
  } catch (caughtException) {
    log.error(
      `EXCEPTION GENERATING CACHE KEY for action handler ${actionHandler.name} ${caughtException}`
    );
  }

  let returned;
  try {
    returned =
      (await exports.getSetCacheableResult(cacheKey, async () =>
        clientChoiceDataFunc(organization, user)
      )) || {};
  } catch (caughtException) {
    log.error(
      `EXCEPTION GETTING CLIENT CHOICE DATA for action handler ${actionHandler.name} ${caughtException}`
    );
    returned = {};
  }

  const data = returned.data || JSON.stringify("{}");

  let parsedData;
  try {
    parsedData = JSON.parse(data);
  } catch (caughtException) {
    log.error(
      `Bad JSON received from ${actionHandler.name}.getClientChoiceData`
    );
    parsedData = {};
  }

  let items = parsedData.items;
  if (items && !(items instanceof Array)) {
    log.error(
      `Data received from ${actionHandler.name}.getClientChoiceData is not an array`
    );
    items = undefined;
  }
  return items || [];
}
