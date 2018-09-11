import { r, OptOut } from '../../models'

// STRUCTURE
// maybe HASH by organization, so optout-<organization_id> has a <cell> key

const orgCacheKey = (orgId) => `${process.env.CACHE_PREFIX|""}optouts-${orgId}`
const instanceCacheKey = `sharedoptouts`
const sharingOptOuts = !!process.env.OPTOUTS_SHARE_ALL_ORGS

const loadMany = async (organizationId) => {
  console.log('org id:', organizationId);
  if (r.redis) {
    if (!sharingOptOuts) {
      const dbResult = await r.knex('opt_out')
        .select('cell')
        .where('organization_id', organizationId)
      const cellOptOuts = dbResult.map((rec) => rec.cell)
      const hashKey = orgCacheKey(organizationId)
      // save 100 at a time
      for (let i100=0, l100=Math.ceil(cellOptOuts.length/100); i100<l100; i100++) {
        await r.redis.saddAsync(hashKey, cellOptOuts.slice(100*i100, 100*i100 + 100))
      }
      await r.redis.expire(hashKey, 86400)
      console.log(`CACHE: Loaded optouts for ${organizationId}`)
    } else {
      const dbResult = await r.knex('opt_out')
        .select('cell')
      const cellOptOuts = dbResult.map((rec) => rec.cell)
      const hashKey = instanceCacheKey
      // save 100 at a time
      for (let i100=0, l100=Math.ceil(cellOptOuts.length/100); i100<l100; i100++) {
        await r.redis.saddAsync(hashKey, cellOptOuts.slice(100*i100, 100*i100 + 100))
      }
      await r.redis.expire(hashKey, 86400)
      console.log(`CACHE: Loaded instance wide opt outs`)
    }
  }
}

export const optOutCache = {
  clearQuery: async ({cell, organizationId}) => {
    console.log('cell for clearQuery:', cell);
    // remove cache by organization
    // (if no cell is present, then clear whole query of organization)
    if (r.redis) {
      if (cell) {
        await r.redis.sdelAsync(orgCacheKey(organizationId), cell)
      } else {
        await r.redis.delAsync(orgCacheKey(organizationId))
      }
    }
  },
  query: async ({cell, organizationId}) => {
    console.log('cell for query:', cell, organizationId);
    const accountingForOrgSharing = (!sharingOptOuts ?
      {'organization_id': organizationId , 'cell': cell } :
      {'cell' : cell }
    )

    console.log('accounting for org sharing:', accountingForOrgSharing)
    // return optout result by db or by cache.
    // for a particular organization, if the org Id is NOT cached
    // then cache the WHOLE set of opt-outs for organizationId at once
    // and expire them in a day.
    if (r.redis) {
      const hashKey = (organizationId ? orgCacheKey(organizationId) : instanceCacheKey)
      console.log('hash key:', hashKey);
      const loadByOrgId = (sharingOptOuts ? false : organizationId)
      const [exists, isMember] = await r.redis.multi()
        .exists(hashKey)
        .sismember(hashKey, cell)
        .execAsync()
      if (exists) {
        return isMember
      } else {
        // note NOT awaiting this -- it should run in background
        // ideally not blocking the rest of the request
        loadMany(loadByOrgId)
      }
    } else {
      const dbResult = await r.knex('opt_out')
        .select('cell')
        .where(accountingForOrgSharing)
        .limit(1)
      return (dbResult.length > 0)
    }
  },
  save: async ({cell, organizationId, assignmentId, reason}) => {
    const updateOrgOrInstanceOptOuts = (!sharingOptOuts ?
      { 'campaign_contact.cell': cell,
        'campaign.organization_id': organizationId,
        'campaign.is_archived': false } :
      { 'campaign_contact.cell': cell,
        'campaign.is_archived': false  
      })

    if (r.redis) {
      const hashKey = (!sharingOptOuts ? orgCacheKey(organizationId) : instanceCacheKey )
      console.log('saving...', hashKey);
      const exists = await r.redis.existsAsync(hashKey)
      if (exists) {
        await r.redis.saddAsync(hashKey, cell)
      }
    }
    // database
    await new OptOut({
      assignment_id: assignmentId,
      organization_id: organizationId,
      reason_code: reason,
      cell
    }).save()

    // update all organization's active campaigns as well
    await r
      .knex('campaign_contact')
      .where(
        'id',
        'in',
        r.knex('campaign_contact')
          .leftJoin('campaign', 'campaign_contact.campaign_id', 'campaign.id')
          .where(updateOrgOrInstanceOptOuts)
          .select('campaign_contact.id')
      )
      .update({
        is_opted_out: true
      })
  },
  loadMany: loadMany
}
