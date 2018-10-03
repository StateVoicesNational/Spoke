import { r, loaders, Campaign } from '../../models'
import { modelWithExtraProps } from './lib'
import { assembleAnswerOptions } from '../../../lib/interaction-step-helpers'

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

const cacheKey = (id) => `${process.env.CACHE_PREFIX || ''}campaign-${id}`

const dbCustomFields = async (id) => {
  const campaignContacts = await r.table('campaign_contact')
    .getAll(id, { index: 'campaign_id' })
    .limit(1)
  if (campaignContacts.length > 0) {
    return Object.keys(JSON.parse(campaignContacts[0].custom_fields))
  }
  return []
}

const dbInteractionSteps = async (id) => {
  const allSteps = await r.table('interaction_step')
    .getAll(id, { index: 'campaign_id' })
    .filter({ is_deleted: false })
  return assembleAnswerOptions(allSteps)
}

const dbContactTimezones = async (id) => (
  (await r.knex('campaign_contact')
   .where('campaign_id', id)
   .distinct('timezone_offset')
   .select())
    .map(contact => contact.timezone_offset)
)

const clear = async (id) => {
  if (r.redis) {
    // console.log('clearing campaign cache')
    await r.redis.delAsync(cacheKey(id))
  }
  loaders.campaign.clear(id)
}

const loadDeep = async (id) => {
  // console.log('load campaign deep', id)
  loaders.campaign.clear(id)
  if (r.redis) {
    const campaign = await Campaign.get(id)
    if (Array.isArray(campaign) && campaign.length === 0) {
      console.error('NO CAMPAIGN FOUND')
      return {}
    }
    if (campaign.is_archived) {
      // console.log('campaign is_archived')
      // do not cache archived campaigns
      await clear(id)
      return campaign
    }
    // console.log('campaign loaddeep', campaign)
    campaign.customFields = await dbCustomFields(id)
    campaign.interactionSteps = await dbInteractionSteps(id)
    campaign.contactTimezones = await dbContactTimezones(id)
    // console.log('loaded deep campaign', JSON.stringify(campaign, null, 2))
    // We should only cache organization data
    // if/when we can clear it on organization data changes
    // campaign.organization = await organizationCache.load(campaign.organization_id)
    // console.log('campaign loaddeep', campaign, JSON.stringify(campaign))
    await r.redis.multi()
      .set(cacheKey(id), JSON.stringify(campaign))
      .expire(cacheKey(id), 86400)
      .execAsync()
  }
  return null
}

const currentEditors = async (campaign, user) => {
  // Add user ID in case of duplicate admin names
  const displayName = `${user.id}~${user.first_name} ${user.last_name}`

  await r.redis.hsetAsync(`campaign_editors_${campaign.id}`, displayName, new Date())
  await r.redis.expire(`campaign_editors_${campaign.id}`, 120)

  let editors = await r.redis.hgetallAsync(`campaign_editors_${campaign.id}`)

  // Only get editors that were active in the last 2 mins, and exclude the
  // current user
  editors = Object.entries(editors).filter(editor => {
    const rightNow = new Date()
    return rightNow - new Date(editor[1]) <= 120000 && editor[0] !== displayName
  })

  // Return a list of comma-separated names
  return editors.map(editor => editor[0].split('~')[1]).join(', ')
}

const campaignCache = {
  load: async (id) => {
    // console.log('campaign cache load', id)
    if (r.redis) {
      let campaignData = await r.redis.getAsync(cacheKey(id))
      // console.log('pre campaign cache', campaignData)
      if (!campaignData) {
        // console.log('no campaigndata', id)
        const campaignNoCache = await loadDeep(id)
        if (campaignNoCache) {
          // not found in db either
          return campaignNoCache
        }
        campaignData = await r.redis.getAsync(cacheKey(id))
        // console.log('new campaign data', campaignData)
      }
      if (campaignData) {
        const campaignObj = JSON.parse(campaignData)
        // console.log('campaign cache', cacheKey(id), campaignObj, campaignData)
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
  clear,
  currentEditors,
  dbCustomFields,
  dbInteractionSteps
}

export default campaignCache
