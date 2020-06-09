import { getConfig } from "../../server/api/lib/config";
import { r } from "../../server/models";

const availabilityCacheKey = (name, organizationId, userId) =>
  `${process.env.CACHE_PREFIX ||
    ""}ingestavail-${name}-${organizationId}-${userId}`;
const choiceDataCacheKey = (name, suffix) =>
  `${process.env.CACHE_PREFIX || ""}ingestchoices-${name}-${suffix}`;

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
  const cacheFunc =
    ingestMethod.clientChoiceDataCacheKey || (org => `${org.id}`);
  const cacheKey = choiceDataCacheKey(
    ingestMethod.name,
    cacheFunc(organization, campaign, user)
  );
  return (
    await getSetCacheableResult(cacheKey, async () =>
      ingestMethod.getClientChoiceData(organization, campaign, user)
    )
  ).data;
}
