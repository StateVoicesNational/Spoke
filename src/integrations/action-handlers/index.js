import { getConfig } from "../../server/api/lib/config";
import { r } from "../../server/models";
import { log } from "../../lib";

const availabilityCacheKey = (name, organizationId, userId) =>
  `${process.env.CACHE_PREFIX ||
    ""}action-avail-${name}-${organizationId}-${userId}`;
const choiceDataCacheKey = (name, suffix) =>
  `${process.env.CACHE_PREFIX || ""}action-choices-${name}-${suffix}`;

export function getActionHandlers(organization) {
  const enabledActionHandlers = (
    getConfig("ACTION_HANDLERS", organization) || "test-action"
  ).split(",");
  const actionHandlers = {};
  enabledActionHandlers.forEach(name => {
    try {
      const c = require(`./${name}.js`);
      actionHandlers[name] = c;
    } catch (err) {
      log.error("ACTION_HANDLERS failed to load actionhandler", name, err);
    }
  });
  return actionHandlers;
}

// TODO(lmp) how do we get organization into this?
const CONFIGURED_ACTION_HANDLERS = getActionHandlers();

// TODO(lmp) this is generic
async function getSetCacheableResult(cacheKey, fallbackFunc) {
  if (r.redis) {
    const cacheRes = await r.redis.getAsync(cacheKey);
    if (cacheRes) {
      return JSON.parse(cacheRes);
    }
  }
  const slowRes = await fallbackFunc();
  if (r.redis && slowRes && slowRes.expiresSeconds) {
    await r.redis
      .multi()
      .set(cacheKey, JSON.stringify(slowRes))
      .expire(cacheKey, slowRes.expiresSeconds)
      .execAsync();
  }
  return slowRes;
}

// TODO(lmp) this could be generic
async function getActionHandlerAvailability(
  name,
  actionHandler,
  organization,
  user
) {
  return (await getSetCacheableResult(
    availabilityCacheKey(name, organization.id, user.id),
    async () => actionHandler.available(organization, user)
  )).result;
}

export function rawActionHandler(name) {
  /// RARE: You should almost always use getActionHandler() below,
  /// unless workflow has already tested availability for the org-user
  return CONFIGURED_ACTION_HANDLERS[name];
}

export function rawAllMethods() {
  return CONFIGURED_ACTION_HANDLERS;
}

export async function getActionHandler(name, organization, user) {
  if (name in CONFIGURED_ACTION_HANDLERS) {
    const isAvail = await getActionHandlerAvailability(
      name,
      CONFIGURED_ACTION_HANDLERS[name],
      organization,
      user
    );
    if (isAvail) {
      return CONFIGURED_ACTION_HANDLERS[name];
    }
  }
}

export async function getAvailableActionHandlers(organization, user) {
  const actionHandlers = await Promise.all(
    Object.keys(CONFIGURED_ACTION_HANDLERS).map(name =>
      getActionHandler(name, organization, user)
    )
  );
  return actionHandlers.filter(x => x);
}

export async function getActionChoiceData(
  actionHandler,
  organization,
  campaign,
  user,
  loaders
) {
  const cacheFunc =
    actionHandler.clientChoiceDataCacheKey || (org => `${org.id}`);
  const clientChoiceDataFunc = actionHandler.getClientChoiceData || (() => {});
  const cacheKey = choiceDataCacheKey(
    actionHandler.name,
    cacheFunc(organization, campaign, user, loaders)
  );
  return (
    (await getSetCacheableResult(cacheKey, async () =>
      clientChoiceDataFunc(organization, campaign, user, loaders)
    )) || {}
  ).data;
}
