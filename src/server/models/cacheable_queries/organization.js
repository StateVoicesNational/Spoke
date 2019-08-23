import { r, loaders } from '../../models'

const cacheKey = (orgId) => `${process.env.CACHE_PREFIX || ''}org-${orgId}`

const organizationCache = {
  clear: async (id) => {
    if (r.redis) {
      await r.redis.delAsync(cacheKey(id))
    }
    loaders.organization.clear(String(id))
    loaders.organization.clear(Number(id))
  },
  load: async (id) => {
    if (r.redis) {
      const orgData = await r.redis.getAsync(cacheKey(id))
      if (orgData) {
        return JSON.parse(orgData)
      }
    }
    const [dbResult] = await r.knex('organization')
      .where('id', id)
      .select('*')
      .limit(1)
    if (dbResult) {
      if (dbResult.features) {
        dbResult.feature = JSON.parse(dbResult.features)
      } else {
        dbResult.feature = {}
      }
      if (r.redis) {
        await r.redis.multi()
          .set(cacheKey(id), JSON.stringify(dbResult))
          .expire(cacheKey(id), 43200)
          .execAsync()
      }
    }
    return dbResult
  }
}

export default organizationCache
