import { r, OptOut } from "../../models";

// STRUCTURE
// SET by organization, so optout-<organization_id> has a <cell> key
//  and membership can be tested

const orgCacheKey = orgId =>
  !!process.env.OPTOUTS_SHARE_ALL_ORGS
    ? `${process.env.CACHE_PREFIX || ""}optouts`
    : `${process.env.CACHE_PREFIX || ""}optouts-${orgId}`;

const sharingOptOuts = !!process.env.OPTOUTS_SHARE_ALL_ORGS;

const loadMany = async organizationId => {
  if (r.redis) {
    // We limit the optout cache load
    // since we only need optouts that occurred between the
    // time we started a campaign and loaded the cache.
    let dbQuery = r
      .knex("opt_out")
      .select("cell")
      .orderBy("id", "desc")
      .limit(process.env.OPTOUTS_CACHE_MAX || 1000000);
    if (!sharingOptOuts) {
      dbQuery = dbQuery.where("organization_id", organizationId);
    }
    const dbResult = await dbQuery;
    const cellOptOuts = dbResult.map(rec => rec.cell);
    const hashKey = orgCacheKey(organizationId);

    // if no optouts, the key should still exist for true negative lookups:
    await r.redis.saddAsync(hashKey, ["0"]);
    await r.redis.expire(hashKey, 43200);

    // save 100 at a time
    for (
      let i100 = 0, l100 = Math.ceil(cellOptOuts.length / 100);
      i100 < l100;
      i100++
    ) {
      await r.redis.saddAsync(
        hashKey,
        cellOptOuts.slice(100 * i100, 100 * i100 + 100)
      );
    }
    return cellOptOuts.length;
  }
};

const optOutCache = {
  clearQuery: async ({ cell, organizationId }) => {
    // remove cache by organization
    // (if no cell is present, then clear whole query of organization)
    if (r.redis) {
      if (cell) {
        await r.redis.sdelAsync(orgCacheKey(organizationId), cell);
      } else {
        await r.redis.delAsync(orgCacheKey(organizationId));
      }
    }
  },
  query: async ({ cell, organizationId }) => {
    // return optout result by db or by cache.
    // for a particular organization, if the org Id is NOT cached
    // then cache the WHOLE set of opt-outs for organizationId at once
    // and expire them in a day.
    const accountingForOrgSharing = !sharingOptOuts
      ? { cell, organization_id: organizationId }
      : { cell };

    if (r.redis) {
      const hashKey = orgCacheKey(organizationId);
      const [exists, isMember] = await r.redis
        .multi()
        .exists(hashKey)
        .sismember(hashKey, cell)
        .execAsync();
      if (exists) {
        return isMember;
      }
      // note NOT awaiting this -- it should run in background
      // ideally not blocking the rest of the request
      loadMany(organizationId)
        .then(optOutCount => {
          if (!global.TEST_ENVIRONMENT) {
            console.log(
              "optOutCache loaded for organization",
              organizationId,
              optOutCount
            );
          }
        })
        .catch(err => {
          console.log(
            "optOutCache Error for organization",
            organizationId,
            err
          );
        });
    }
    const dbResult = await r
      .knex("opt_out")
      .select("cell")
      .where(accountingForOrgSharing)
      .limit(1);
    return dbResult.length > 0;
  },
  save: async ({ cell, campaignContactId, campaign, assignmentId, reason }) => {
    const organizationId = campaign.organization_id;
    if (r.redis) {
      const hashKey = orgCacheKey(organizationId);
      const exists = await r.redis.existsAsync(hashKey);
      if (exists) {
        await r.redis.saddAsync(hashKey, cell);
      }
    }
    // database
    await new OptOut({
      assignment_id: assignmentId,
      organization_id: organizationId,
      reason_code: reason,
      cell
    }).save();

    // update all organization/instance's active campaigns as well
    const updateOrgOrInstanceOptOuts = !sharingOptOuts
      ? {
          "campaign_contact.cell": cell,
          "campaign.organization_id": organizationId,
          "campaign.is_archived": false
        }
      : { "campaign_contact.cell": cell, "campaign.is_archived": false };
    await r
      .knex("campaign_contact")
      .where(
        "id",
        "in",
        r
          .knex("campaign_contact")
          .leftJoin("campaign", "campaign_contact.campaign_id", "campaign.id")
          .where(updateOrgOrInstanceOptOuts)
          .select("campaign_contact.id")
      )
      .update({
        is_opted_out: true
      });
  },
  loadMany
};

export default optOutCache;
