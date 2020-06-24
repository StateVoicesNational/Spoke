import { r, Campaign } from "../../models";
import { modelWithExtraProps } from "./lib";
import { assembleAnswerOptions } from "../../../lib/interaction-step-helpers";
import { getFeatures } from "../../api/lib/config";
import organizationCache from "./organization";

// This should be cached data for a campaign that will not change
// based on assignments or texter actions
// GET campaign-<campaignId>
//   archived
//   useDynamicAssignment
//   organization: {}
//   customFields
//   interactionSteps

// Only cache NON-archived campaigns
//   should clear when archiving is done
// TexterTodo.jsx uses:
// * interactionSteps
// * customFields
// * organization metadata (saved in organization.js instead)
// * campaignCannedResponses (saved in canned-responses.js instead)

const cacheKey = id => `${process.env.CACHE_PREFIX || ""}campaign-${id}`;
const infoCacheKey = id =>
  `${process.env.CACHE_PREFIX || ""}campaigninfo-${id}`;

const CONTACT_CACHE_ENABLED =
  process.env.REDIS_CONTACT_CACHE || global.REDIS_CONTACT_CACHE;

const dbCustomFields = async id => {
  const campaignContacts = await r
    .table("campaign_contact")
    .getAll(id, { index: "campaign_id" })
    .limit(1);
  if (campaignContacts.length > 0) {
    return Object.keys(JSON.parse(campaignContacts[0].custom_fields));
  }
  return [];
};

const dbInteractionSteps = async id => {
  const allSteps = await r
    .table("interaction_step")
    .getAll(id, { index: "campaign_id" })
    .filter({ is_deleted: false })
    .orderBy("id");
  const data = assembleAnswerOptions(allSteps);
  // console.log("cacheabledata.campaign.dbInteractionSteps", id, data);
  return data;
};

const dbContactTimezones = async id =>
  (
    await r
      .knex("campaign_contact")
      .where("campaign_id", id)
      .distinct("timezone_offset")
      .select()
  ).map(contact => contact.timezone_offset);

const clear = async (id, campaign) => {
  if (r.redis) {
    // console.log('clearing campaign cache')
    await r.redis.delAsync(cacheKey(id));
  }
};

const loadDeep = async id => {
  // console.log('load campaign deep', id)
  if (r.redis) {
    const campaign = await Campaign.get(id);
    if (Array.isArray(campaign) && campaign.length === 0) {
      console.error("NO CAMPAIGN FOUND");
      return {};
    }
    if (campaign.is_archived) {
      // console.log('campaign is_archived')
      // do not cache archived campaigns
      return campaign;
    }
    // console.log('campaign loaddeep', campaign)
    campaign.customFields = await dbCustomFields(id);
    campaign.interactionSteps = await dbInteractionSteps(id);
    campaign.contactTimezones = await dbContactTimezones(id);
    campaign.contactsCount = await r.getCount(
      r.knex("campaign_contact").where("campaign_id", id)
    );
    // cache userIds for all assignments
    // console.log('loaded deep campaign', JSON.stringify(campaign, null, 2))
    // We should only cache organization data
    // if/when we can clear it on organization data changes
    // campaign.organization = await organizationCache.load(campaign.organization_id)
    // console.log('campaign loaddeep', campaign, JSON.stringify(campaign))
    await r.redis
      .multi()
      .set(cacheKey(id), JSON.stringify(campaign))
      .hset(infoCacheKey(id), "contactsCount", campaign.contactsCount)
      .expire(cacheKey(id), 43200)
      .expire(infoCacheKey(id), 43200)
      .execAsync();
  }
  return null;
};

const currentEditors = async (campaign, user) => {
  // Add user ID in case of duplicate admin names
  const displayName = `${user.id}~${user.first_name} ${user.last_name}`;

  await r.redis.hsetAsync(
    `campaign_editors_${campaign.id}`,
    displayName,
    new Date()
  );
  await r.redis.expire(`campaign_editors_${campaign.id}`, 120);

  let editors = await r.redis.hgetallAsync(`campaign_editors_${campaign.id}`);

  // Only get editors that were active in the last 2 mins, and exclude the
  // current user
  editors = Object.entries(editors).filter(editor => {
    const rightNow = new Date();
    return (
      rightNow - new Date(editor[1]) <= 120000 && editor[0] !== displayName
    );
  });

  // Return a list of comma-separated names
  return editors.map(editor => editor[0].split("~")[1]).join(", ");
};

const load = async (id, opts) => {
  // console.log('campaign cache load', id)
  if (r.redis) {
    let campaignData = await r.redis.getAsync(cacheKey(id));
    let campaignObj = campaignData ? JSON.parse(campaignData) : null;
    // console.log('pre campaign cache', campaignObj)
    if (
      (opts && opts.forceLoad) ||
      !campaignObj ||
      !campaignObj.interactionSteps
    ) {
      // console.log('no campaigndata', id, campaignObj)
      const campaignNoCache = await loadDeep(id);
      if (campaignNoCache) {
        // archived or not found in db either
        return campaignNoCache;
      }
      campaignData = await r.redis.getAsync(cacheKey(id));
      campaignObj = campaignData ? JSON.parse(campaignData) : null;
      // console.log('new campaign data', id, campaignData)
    }
    if (campaignObj) {
      const counts = [
        "assignedCount",
        "messagedCount",
        "needsResponseCount",
        "errorCount"
      ];
      const countKey = infoCacheKey(id);
      for (let i = 0, l = counts.length; i < l; i++) {
        const countName = counts[i];
        campaignObj[countName] = await r.redis.hgetAsync(countKey, countName);
      }
      campaignObj.feature = getFeatures(campaignObj);
      // console.log('campaign cache', cacheKey(id), campaignObj, campaignData)
      const campaign = modelWithExtraProps(campaignObj, Campaign, [
        "customFields",
        "feature",
        "interactionSteps",
        "contactTimezones",
        "contactsCount",
        ...counts
      ]);
      return campaign;
    }
  }

  return await Campaign.get(id);
};

const campaignCache = {
  clear,
  load,
  loadCampaignOrganization: async ({ campaign, campaignId, organization }) => {
    const already = organization || (campaign && campaign.organization);
    if (already) {
      return already;
    }
    if (campaign && campaign.organization_id) {
      return await organizationCache.load(campaign.organization_id);
    }
    if (!campaignId) {
      return;
    }
    if (r.redis) {
      const c = await load(campaignId);
      return await organizationCache.load(c.organization_id);
    } else {
      const org = await r
        .knex("organization")
        .select("organization.*")
        .join("campaign", "campaign.organization_id", "organization.id")
        .where("campaign.id", campaignId)
        .first();
      return org;
    }
  },
  reload: loadDeep,
  currentEditors,
  dbCustomFields,
  dbInteractionSteps,
  completionStats: async id => {
    if (r.redis) {
      const data = await r.redis.hgetallAsync(infoCacheKey(id));
      return data || {};
    }
    return {};
  },
  updateAssignedCount: async id => {
    if (r.redis) {
      try {
        const assignCount = await r.getCount(
          r
            .knex("campaign_contact")
            .where("campaign_id", id)
            .whereNotNull("assignment_id")
        );
        const infoKey = infoCacheKey(id);
        await r.redis
          .multi()
          .hset(infoKey, "assignedCount", assignCount)
          .expire(infoKey, 432000) // counts stay 5 days for easier review
          .execAsync();
      } catch (err) {
        console.log("campaign.updateAssignedCount Error", id, err);
      }
    }
  },
  incrCount: async (id, countType, countAmount) => {
    // countType={"messagedCount", "errorCount", "needsResposneCount", "assignedCount"}
    // console.log("incrCount", id, countType, CONTACT_CACHE_ENABLED);
    if (r.redis) {
      try {
        const infoKey = infoCacheKey(id);
        await r.redis
          .multi()
          .hincrby(
            infoKey,
            countType,
            typeof countAmount === "number" ? countAmount : 1
          )
          .expire(infoKey, 432000) // counts stay 5 days for easier review
          .execAsync();
      } catch (err) {
        console.log("campaign.incrMessaged Error", id, err);
      }
    }
  }
};

export default campaignCache;
