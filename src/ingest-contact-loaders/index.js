import { getConfig } from "../server/api/lib/config";
import { r } from "../server/models";

const availabilityCacheKey = (name, organizationId) =>
      `${process.env.CACHE_PREFIX || ""}ingestavail-${name}-${organizationId}`;
const choiceDataCacheKey = (suffix) => `${process.env.CACHE_PREFIX || ""}ingestchoices-${suffix}`;


function getIngestMethods() {
  // TODO: default will be csv-upload for real version
  const enabledIngestMethods = (getConfig("CONTACT_LOADERS") || "test-fakedata").split(",");
  const ingestMethods = {}
  enabledIngestMethods.forEach(name => {
    try {
      const c = require(`./${name}/index.js`);
      ingestMethods[name] = c;
    } catch(err) {
      console.error(
        "CONTACT_LOADERS failed to load ingestMethod", name
      );
    }
  });
  return ingestMethods
}

const CONFIGURED_INGEST_METHODS = getIngestMethods();

async function getSetCacheableResult(cacheKey, fallbackFunc) {
  if (r.redis) {
    const cacheRes = await r.redis.get(cacheKey);
    if (cacheRes) {
      return JSON.parse(cacheRes);
    }
  }
  const slowRes = await fallbackFunc();
  if (r.redis && slowRes && slowRes.expireSeconds) {
    await r.redis.set(cacheKey, JSON.stringify(slowRes), slowRes.expireSeconds);
  }
  return slowRes;
}

async function getIngestAvailability(name, ingestMethod, organization) {
  return await getSetCacheableResult(
    availabilityCacheKey(name, organization.id),
    async () => ingestMethod.available(organization));
}

export async function getIngestMethod(name, organization) {
  if (name in CONFIGURED_INGEST_METHODS) {
    const isAvail = await getIngestAvailability(
      name,
      CONFIGURED_INGEST_METHODS[name],
      organization);
    if (isAvail.result) {
      return CONFIGURED_INGEST_METHODS[name];
    }
  }
}

export async function getAvailableIngestMethods(organization) {
  return Promise.all(
    Object.keys(CONFIGURED_INGEST_METHODS)
      .map(name => getIngestMethod(name, organization)));
}

export async function getMethodChoiceData(ingestMethod, organization, campaign, user, loaders) {
  const cacheFunc = ingestMethod.clientChoiceDataCacheKey || ((org) => `${org.id}`);
  const cacheKey = choiceDataCacheKey(cacheFunc(organization, campaign, user, loaders));
  return (await getSetCacheableResult(cacheKey, async () => (
    ingestMethod.getClientChoiceData(organization, campaign, user, loaders)
  ))).data;
}
