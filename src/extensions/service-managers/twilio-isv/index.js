import { r } from "../../../server/models";
import { TwilioISV } from "./isv";

/// All functions are OPTIONAL EXCEPT metadata() and const name=.
/// DO NOT IMPLEMENT ANYTHING YOU WILL NOT USE -- the existence of a function adds behavior/UI (sometimes costly)
const isvDataCacheKey = orgId =>
  `${process.env.CACHE_PREFIX || ""}twilio-isv-${orgId}`;

export const name = "twilio-isv";

export const metadata = () => ({
  // set canSpendMoney=true, if this extension can lead to (additional) money being spent
  // if it can, which operations below can trigger money being spent?
  displayName: "Twilio ISV management",
  description:
    "If ISV api access has been enabled on your account, then you can manage/review brands/campaigns/etc",
  canSpendMoney: true,
  moneySpendingOperations: ["onOrganizationUpdateSignal"],
  supportsOrgConfig: true,
  supportsCampaignConfig: false
});

async function getIsvData({ organization, clearCache, keyClear, isvClient }) {
  const cacheKey = isvDataCacheKey(organization.id);
  const isv = isvClient || new TwilioISV({ organization, debug: true });
  const rv = {};
  if (r.redis && !clearCache) {
    const res = await r.redis.getAsync(cacheKey);
    if (res) {
      console.log("CACHING", res.length);
      Object.assign(rv, JSON.parse(res), { fromCache: true });
    }
  }
  const gotIt = key => (!keyClear || keyClear !== key) && rv[key];
  rv.policies = gotIt("policies") || (await isv.getPolicies());
  rv.profiles = gotIt("profiles") || (await isv.getProfiles());
  rv.brands = gotIt("brands") || (await isv.getBrands());
  rv.endUsers = gotIt("endUsers") || (await isv.getEndUsers());
  if (r.redis) {
    await r.redis
      .multi()
      .set(cacheKey, JSON.stringify(rv))
      .expire(cacheKey, 82600)
      .execAsync();
  }
  return rv;
}

export async function getOrganizationData({ organization, user, loaders }) {
  // MUST NOT RETURN SECRETS!
  const isvData = await getIsvData({ organization });

  return {
    // data is any JSON-able data that you want to send.
    // This can/should map to the return value if you implement onOrganizationUpdateSignal()
    // which will then get updated data in the Settings component on-save
    data: isvData,
    // fullyConfigured: null means (more) configuration is optional -- maybe not required to be enabled
    // fullyConfigured: true means it is fully enabled and configured for operation
    // fullyConfigured: false means more configuration is REQUIRED (i.e. manager is necessary and needs more configuration for Spoke campaigns to run)
    fullyConfigured: null
  };
}

export async function onOrganizationServiceVendorSetup({
  organization,
  user,
  serviceName,
  oldConfig,
  newConfig
}) {}

export async function onOrganizationUpdateSignal({
  organization,
  user,
  updateData
}) {
  console.log("onOrganizationUpdateSignal", updateData);
  const isvClient = new TwilioISV({ organization, debug: true });
  const isvDataArgs = {};
  if (updateData.command === "clearCache") {
    isvDataArgs.clearCache = true;
  } else if (updateData.command === "addCampaignVerifyToken") {
    const { brandId, campaignVerifyToken } = updateData;
    const cvRes = await isvClient.setBrandCampaignVerify({
      brandId,
      campaignVerifyToken
    });
    isvDataArgs.keyClear = "brands";
  }
  const isvData = await getIsvData({ organization, isvClient, ...isvDataArgs });
  return {
    data: Object.assign({}, isvData, updateData),
    fullyConfigured: true
  };
}
