import { r } from "../../models";

// TODO: Add OPTINS_SHARE_ALL_ORGS to env doc

const orgCacheKey = orgId =>
    !!process.env.OPTINS_SHARE_ALL_ORGS
        ? `${process.env.CAHCE_PREFIX || ""}:optins`
        : `${process.env.CACHE_PREFIS || ""}:optins-${orgId}`;

const sharingOptIns = !!process.env.OPTINS_SHARE_ALL_ORGS

// Probably not needed, but good to offload stress from
// db. 
const loadMany = async organizationId => {
    if (r.redis) {
        let dbQuery = r
            .knex("opt_in")
            .select("cell")
            .orderBy("id", "desc")
            .limit(process.env.OPTINS_CACHE_MAX || 1000000);
        
        if (!sharingOptIns) {
            dbQuery = dbQuery.where("organization_id", organizationId);
        }
        const dbResult = await dbQuery;
        const cellOptIns = dbResult.map(rec => rec.cell);
        const hashKey = orgCacheKey(organizationId);

        await r.redis.SADD(hashKey, ["0"]);
        await r.redis.expire(hashKey, 43200);

        for (
            let i100 = 0, l100 = Math.ceil(cellOptOuts.length / 100);
            i100 < l100;
            i100++
        ) {
            await r.redis.SADD(
                hashKey,
                cellOptIns.slice(100 * i100, 100 * i100 + 100)
            );
        }
        return cellOptIns.length;
    }
}

const updateIsOptedIn = async queryModifier => {
    // update all organization/instance's active campaigns
    const optInContactQuery = r
        .knex("campaign_contact")
        .join("campaign", "campaign_contact.id", "campaign.id")
        .where("campaign.is_archived", false)
        .select("campaign_contact.id");

    return await r
        .knex("campaign_contact")
        .whereIn(
            "id",
            queryModifier ? queryModifier(optInContactQuery) : optInContactQuery
        )
        .update("is_opted_in", true)
        .update({
            is_opted_in: true
        })
}

const optInCache = {
    clearQuery: async ({ cell, organizationId }) => {
        if (r.redis) {
            if (cell) {
                await r.redis.sdel(orgCacheKey(organizationId), cell);
            } else {
                await r.redis.DEL(orgCacheKey(organizationId));
            }
        }
    },
    query: async ({ cell, organizationId }) => {
        const accountingForOrgSharing = !sharingOptIns
            ? { cell, organization_id: organizationId }
            : { cell };
        
        if (r.redis) {
            const hashKey = orgCacheKey(organizationId);
            const [exists, isMember] = await r.redis
                .MULTI()
                .EXISTS(hashKey)
                .SISMEMBER(hashKey, cell)
                .exec();
            if (exists) {
                return isMember;
            }

            loadMany(organizationId)
                .then(optInCount => {
                    if (!global.TEST_ENVIRONMENT) {
                        console.log(
                            "optInCache loaded for organization",
                            organizationId,
                            optInCount
                        );
                    }
                })
                .catch(err => {
                    console.log(
                        "optInCache Error for organization",
                        organizationId,
                        err
                    );
                });
        }
        const dbResult = await r
            .knex("opt_in")
            .select("cell")
            .where(accountingForOrgSharing)
            .limit(1);
        return dbResult.length > 0
    },
    save: async ({
        cell,
        campaign,
        assignmentId,
        reason
    }) => {
        const organizationId = campaign.organization_id;
        if (r.redis) {
            const hashKey = orgCacheKey(organizationId);
            const exists = await r.redis.exists(hashKey);
            if (exists) {
                await r.redis.SADD(hashKey, cell);
            }
        }

        // place into db
        await r.knex("opt_in").insert({
            assignment_id: assignmentId,
            organization_id: organizationId,
            reason_code: reason,
            cell
        });
    },
    loadMany,
    updateIsOptedIn
}

export default optInCache;