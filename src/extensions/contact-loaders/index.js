import { getConfig } from "../../server/api/lib/config";
import { r } from "../../server/models";

const availabilityCacheKey = (name, organizationId, userId) =>
  `${process.env.CACHE_PREFIX ||
    ""}ingestavail-${name}-${organizationId}-${userId}`;
const choiceDataCacheKey = (name, organizationId, suffix) =>
  `${process.env.CACHE_PREFIX ||
    ""}ingestchoices-${name}-${organizationId}-${suffix}`;

const CONFIGURED_INGEST_METHODS = getIngestMethods();

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

async function getIngestAvailability(name, ingestMethod, organization, user) {
  return (
    await getSetCacheableResult(
      availabilityCacheKey(name, organization.id, user.id),
      async () => ingestMethod.available(organization, user)
    )
  ).result;
}

export function rawIngestMethod(name) {
  /// RARE: You should almost always use getIngestMethod() below,
  /// unless workflow has already tested availability for the org-user
  return CONFIGURED_INGEST_METHODS[name];
}

export function rawAllMethods() {
  return CONFIGURED_INGEST_METHODS;
}

export async function getIngestMethod(name, organization, user) {
  if (name in CONFIGURED_INGEST_METHODS) {
    const isAvail = await getIngestAvailability(
      name,
      CONFIGURED_INGEST_METHODS[name],
      organization,
      user
    );
    if (isAvail) {
      return CONFIGURED_INGEST_METHODS[name];
    }
  }
}

export async function getAvailableIngestMethods(organization, user) {
  const enabledIngestMethods = (
    getConfig("CONTACT_LOADERS", organization) ||
    "csv-upload,test-fakedata,datawarehouse"
  ).split(",");

  const ingestMethods = await Promise.all(
    enabledIngestMethods
      .filter(name => name in CONFIGURED_INGEST_METHODS)
      .map(name => getIngestMethod(name, organization, user))
  );
  return ingestMethods.filter(x => x);
}

export async function getMethodChoiceData(
  ingestMethod,
  organization,
  campaign,
  user
) {
  const cacheFunc = ingestMethod.clientChoiceDataCacheKey || (() => "");
  const cacheKey = choiceDataCacheKey(
    ingestMethod.name,
    organization.id,
    cacheFunc(campaign, user)
  );
  return (
    await getSetCacheableResult(cacheKey, async () =>
      ingestMethod.getClientChoiceData(organization, campaign, user)
    )
  ).data;
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

export const clearCacheForOrganization = async organizationId => {
  if (!r.redis) {
    return;
  }

  const handlerNames = Object.keys(CONFIGURED_INGEST_METHODS);
  const promiseArray = handlerNames.map(handlerName => [
    r.redis.keysAsync(
      `${choiceDataCacheKey(handlerName, organizationId, "*")}`
    ),
    r.redis.keysAsync(
      `${availabilityCacheKey(handlerName, organizationId, "*")}`
    )
  ]);

  const flattenedPromises = [];
  promiseArray.forEach(promises => {
    flattenedPromises.push(...promises);
  });

  const keysResults = await Promise.all(flattenedPromises);
  const keys = [];
  keysResults.forEach(keysResult => {
    keys.push(...keysResult);
  });

  const delPromises = keys.map(key => r.redis.delAsync(key));
  await Promise.all(delPromises);
};

function getIngestMethods() {
  const enabledIngestMethods = (
    getConfig("CONTACT_LOADERS") || "csv-upload,test-fakedata,datawarehouse"
  ).split(",");
  const ingestMethods = {};
  enabledIngestMethods.forEach(name => {
    try {
      const c = require(`./${name}/index.js`);
      ingestMethods[name] = c;
    } catch (err) {
      console.error("CONTACT_LOADERS failed to load ingestMethod", name, err);
    }
  });
  return ingestMethods;
}
