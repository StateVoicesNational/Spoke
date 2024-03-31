import { r, Campaign } from "../../models";
import { modelWithExtraProps } from "./lib";
import {
  assembleAnswerOptions,
  getUsedScriptFields
} from "../../../lib/interaction-step-helpers";
import { getFeatures, getConfig } from "../../api/lib/config";
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
const exportCampaignCacheKey = id =>
  `${process.env.CACHE_PREFIX || ""}campaignexport-${id}`;

const CONTACT_CACHE_ENABLED =
  process.env.REDIS_CONTACT_CACHE || global.REDIS_CONTACT_CACHE;

const dbCustomFields = async id => {
  // This rather Byzantine query just to get the first record
  // is due to postgres query planner (for 11.8 anyway) being particularly aggregious
  // This forces the use of the campaign_id index to get the minimum contact.id
  const firstContact = await r
    .knex("campaign_contact")
    .select("custom_fields")
    .whereIn(
      "campaign_contact.id",
      r
        .knex("campaign")
        .join("campaign_contact", "campaign_contact.campaign_id", "campaign.id")
        .select(r.knex.raw("min(campaign_contact.id) as id"))
        .where("campaign.id", id)
    )
    .first();
  if (firstContact) {
    return Object.keys(JSON.parse(firstContact.custom_fields));
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
    await r.redis.DEL(cacheKey(id));
  }
};

const loadDeep = async id => {
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
    campaign.customFields = await dbCustomFields(id);
    campaign.interactionSteps = await dbInteractionSteps(id);
    campaign.usedFields = getUsedScriptFields(
      campaign.interactionSteps,
      "script"
    );
    if (getConfig("MOBILIZE_EVENT_SHIFTER_URL")) {
      campaign.usedFields.cell = 1;
      campaign.usedFields.email = 1;
      campaign.usedFields.zip = 1;
      campaign.usedFields.event_id = 1;
    }
    if (getConfig("TEXTER_SIDEBOX_FIELDS")) {
      const fields = getConfig("TEXTER_SIDEBOX_FIELDS").split(",");
      fields.forEach(f => {
        campaign.usedFields[f] = 1;
      });
    }
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
      .MULTI()
      .SET(cacheKey(id), JSON.stringify(campaign))
      .HSET(infoCacheKey(id), "contactsCount", campaign.contactsCount)
      .EXPIRE(cacheKey(id), 43200)
      .EXPIRE(infoCacheKey(id), 43200)
      .exec();
  }
  return null;
};

const currentEditors = async (campaign, user) => {
  // Add user ID in case of duplicate admin names
  const displayName = `${user.id}~${user.first_name} ${user.last_name}`;

  await r.redis.HGET(
    `campaign_editors_${campaign.id}`,
    displayName,
    new Date()
  );
  await r.redis.EXPIRE(`campaign_editors_${campaign.id}`, 120);

  let editors = await r.redis.hgetall(`campaign_editors_${campaign.id}`);

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
    let campaignData = await r.redis.get(cacheKey(id));
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
      campaignData = await r.redis.get(cacheKey(id));
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
        campaignObj[countName] = await r.redis.HGET(countKey, countName);
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
      const data = await r.redis.hgetall(infoCacheKey(id));
      return data || {};
    }
    return {};
  },
  saveExportData: async (id, data) => {
    if (r.redis) {
      const exportCacheKey = exportCampaignCacheKey(id);
      await r.redis
        .MULTI()
        .SET(exportCacheKey, JSON.stringify(data))
        .EXPIRE(exportCacheKey, 43200)
        .exec();
    }
  },
  getExportData: async id => {
    if (r.redis) {
      const exportCacheKey = exportCampaignCacheKey(id);
      const data = await r.redis.get(exportCacheKey);
      if (data) {
        return JSON.parse(data);
      }
    }
    return null;
  },
  setFeatures: async (id, newFeatures) => {
    if (!id || !newFeatures) {
      return;
    }
    const features = await r.knex.transaction(async trx => {
      const campaignDb = await trx("campaign")
        .where("id", id)
        .select("features");
      const features = getFeatures(campaignDb[0]);
      let changes = false;
      for (const [featureName, featureValue] of Object.entries(newFeatures)) {
        if (features[featureName] !== featureValue) {
          features[featureName] = featureValue;
          changes = true;
        }
      }
      if (changes) {
        const featuresString = JSON.stringify(features);
        await trx("campaign")
          .where("id", id)
          .update("features", featuresString);
        if (r.redis) {
          const campaignCache = await r.redis.get(cacheKey(id));
          if (campaignCache) {
            const campaignObj = JSON.parse(campaignCache);
            campaignObj.feature = features;
            campaignObj.features = featuresString;
            await r.redis
              .MULTI()
              .SET(cacheKey(id), JSON.stringify(campaignObj))
              .EXPIRE(cacheKey(id), 10000)
              .exec();
          }
        }
      }
      return features;
    });
    return features;
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
          .MULTI()
          .HSET(infoKey, "assignedCount", assignCount)
          .EXPIRE(infoKey, 432000) // counts stay 5 days for easier review
          .exec();
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
          .MULTI()
          .HINCRBY(
            infoKey,
            countType,
            typeof countAmount === "number" ? countAmount : 1
          )
          .EXPIRE(infoKey, 432000) // counts stay 5 days for easier review
          .exec();
      } catch (err) {
        console.log("campaign.incrMessaged Error", id, err);
      }
    }
  }
};

export default campaignCache;
