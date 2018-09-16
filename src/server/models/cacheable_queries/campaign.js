import { r, Campaign } from '../../models'
import { organizationCache } from './organization'
import { modelWithExtraProps } from './lib'

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

const cacheKey = (id) => `${process.env.CACHE_PREFIX|""}campaign-${id}`

const dbCustomFields = async (id) => {
  const campaignContacts = await r.table('campaign_contact')
    .getAll(id, { index: 'campaign_id' })
    .limit(1)
  if (campaignContacts.length > 0) {
    return Object.keys(JSON.parse(campaignContacts[0].custom_fields))
  }
  return []
}

const dbInteractionSteps = async (id) => (
  await r.table('interaction_step')
    .getAll(id, { index: 'campaign_id' })
    .filter({ is_deleted: false })
)

const dbContactTimezones = async (id) => (
  (await r.knex('campaign_contact')
   .where('campaign_id', id)
   .distinct('timezone_offset')
   .select())
    .map(contact => contact.timezone_offset)
)

const clear = async (id) => {
  if (r.redis) {
    console.log('clearing campaign cache')
    await r.redis.delAsync(cacheKey(id))
  }
}

const loadDeep = async (id) => {
  console.log('load campaign deep', id)
  if (r.redis) {
    const campaign = await Campaign.get(id)
    if (campaign.is_archived) {
      // do not cache archived campaigns
      await clear(id)
      return campaign
    }
    campaign.customFields = await dbCustomFields(id)
    campaign.interactionSteps = await dbInteractionSteps(id)
    campaign.contactTimezones = await dbContactTimezones(id)
    console.log('loaded deep campaign', campaign)
    // We should only cache organization data
    // if/when we can clear it on organization data changes
    //campaign.organization = await organizationCache.load(campaign.organization_id)

    await r.redis.multi()
      .set(cacheKey(id), JSON.stringify(campaign))
      .expire(cacheKey(id), 86400)
      .execAsync()
  }
  return null
}

export const campaignCache = {
  clear: clear,
  load: async(id) => {
    if (r.redis) {
      let campaignData = await r.redis.getAsync(cacheKey(id))
      if (!campaignData) {
        const campaignNoCache = await loadDeep(id)
        if (campaignNoCache) {
          return campaignNoCache
        }
        campaignData = await r.redis.getAsync(cacheKey(id))
      }
      if (campaignData) {
        const campaignObj = JSON.parse(campaignData)
        const campaign = modelWithExtraProps(
          campaignObj,
          Campaign,
          ['customFields', 'interactionSteps', 'contactTimezones'])
        return campaign
      }
    }
    return await Campaign.get(id)
  },
  reload: loadDeep,
  dbCustomFields: dbCustomFields,
  dbInteractionSteps: dbInteractionSteps
}
