import { r } from '../models'
import { getTotalContactCount, campaignTimezoneConfig } from './assignment-contacts'
import { getOffsets } from '../../../lib'

const cachePrefix = process.env.CACHE_PREFIX || ''

// KEY contact assignment

// SORTED SET needsMessage-<campaignId> to use ZPOPMIN to assign into inFlight
//  While sorted set has a slower add-complexity, O(log(N)), it's very important
//  that we don't accidentally add a contactId twice
const needsMessageQueueKey = (campaignId) => `${cachePrefix}needsMessage-${campaignId}`

// SORTED SET inflight-<campaignId> with key=<contactId>, score=<userId>
const inFlightKey = (campaignId) => `${cachePrefix}inflight-${campaignId}`


// TODO: CLIENT FRONTEND TODOS
// 1. only poll frontend if cached is enabled
// 2. 

const currentUserInflight = async (assignment) => {
  if (r.redis) {
    const key = inFlightKey(assignment.campaign_id)
    const [exists, count] = r.redis.multi()
      .exists(key)
      .zcount(key, assignment.user_id, assignment.user_id)
      .execAsync()
    if (exists) {
      return count
    }
  }
  return await r.getCount(
    r.knex('campaign_contact').where({
      assignment_id: assignment.id,
      message_status: 'needsMessage',
      is_opted_out: false
    })
  )
}

const popInflight = async (assignment, campaign, organization, numberContacts) => {
  // Look for contacts to assign
  // If available, then assign them and push them to assignee
  // ASSUMES we've already checked various reasons and counts for the campaign and assignment
  if (r.redis) {
    // 1. POP contacts from needsMessage queue
    //    1.1 if not enough there, then look for stale protoassignments in inflight queue
    //    1.2 if the results are not in a valid timezone offset, then WHAT DO?
    //        -- maybe push them back to the end and pop again
    const [validOffsets, invalidOffsets] = getOffsets(campaignTimezoneConfig(organization, campaign))
    
    // 2. push contactIds with assignmentId score onto inflight
    // 3. update contact.assignment_id and contact.user_id
    // 4. push into assignment-contacts (with appropriate timezones!)

  }
  return null
}

export const reloadCampaignContactsForDynamicAssignment = async (campaign, organization) => {
  // TODO: should we SORT by timezone_offset in anyway?
  if (r.redis && campaign.use_dynamic_assignment) {
    const needsMessageKey = needsMessageQueueKey(campaign.id)
    // TODO: what if this is 1million?  We shouldn't load them all
    const contactsToDynAssign = (await r.knex('campaign_contact')
      .where({ is_opted_out: false,
               campaign_id: campaign.id,
               assignment_id: null
             })
      .select('id', 'timezone_offset'))
    await r.redis.delAsync(needsMessageKey)
    for (let i500 = 0, l500 = Math.ceil(contactsToDynAssign.length / 500); i500 < l500; i500++) {
      const batch = []
      contactsToDynAssign.slice(500 * i500, 500 * i500 + 500).forEach(c) => {
        batch.push(c.id, [c.id, c.timezone_offset].join(':'))
      })
      await r.redis.zaddAsync(needsMessageKey, ...batch)
    }
  }
}

/*const dynamicAssignmentCache = {
  clearCampaign: async (campaignId) => {
  },
  clearAssignment: async (assignmentId, campaign, userId) => {
    // 0. make sure we don't delete userId if userId was just given a *new* assignment record
    // 1. get assignment and/or user_id from db or from args
    // 2. set campaignassignments with key=<userId> to score=0
    // 3. remove from userassignments cache

  },
  loadCampaign: async (campaignId) => {
    // add in: contact_id AND timezone_offset
  },
*/
export const assignNewContacts = async (assignment, campaign, numberContacts) => {
  // Returns false if none found, and returns true-ish value
  // If new contacts were assigned with DB then we return the count
  // If new contacts were assigned in cache-mode, we return an array of contactIds

  // 0. Basic stuff
  if (!campaign.use_dynamic_assignment || assignment.max_contacts === 0) {
    return false
  }

  // 1. Make sure texter isn't maxed out on contacts
  const contactsCount = await getTotalContactCount(assignment, campaign)

  let finalNumberContacts = numberContacts || 1
  if (assignment.max_contacts && assignment.max_contacts !== null && contactsCount + finalNumberContacts > assignment.max_contacts) {
    finalNumberContacts = assignment.max_contacts - contactsCount
  }
  if (finalNumberContacts <= 0) {
    return false
  }
  
  // 2. Make sure texter doesn't have too many messages in-flight
  //    i.e. Don't add more if they already have that many
  const inFlightCount = await currentUserInfFlight(assignment)
  if (inFlightCount >= finalNumberContacts) {
      return false
  }
    
  // 3. Look for assignable contacts and assign them to the texter

  // NOTE contactIds is a QUERY and we don't get the results
  // If we use it instead of the cache, then knex will use it
  // as a subquery in one-go, and then we avoid race conditions
  let contactIds = r.knex('campaign_contact')
    .where({ assignment_id: null,
             campaign_id: campaign.id
           })
    .limit(finalNumberContacts)
    .select('id')
  if (r.redis) {
    const poppedInFlight = await popInflight(assignment, campaign, finalNumberContacts)
    if (poppedInFlight !== null) {
      // We were able to use the cache to see if there were contacts to dynamically assign
      if (!poppedInFlight.length) {
        return false
      }
      contactIds = poppedInFlight
    }
  }
  try {
    const updatedCount = await r
      .knex('campaign_contact')
      .whereIn('id', contactIds)
      .update({ assignment_id: assignment.id })
  } catch(err) {
    console.error('FAILED assignment update', err, assignment, finalNumberContacts)
  }
      
  if (updatedCount > 0) {
    return (Array.isArray(contactIds) ? contactIds : updatedCount)
  } else {
    return false
  }
}
/*
  assignTexter: async (campaignId, userId, campaignContactId) => {
    // 1. update assignmentcontacts with campaignContactId
    // 2. remove contactId from inflight queue
    // 3. update campaignassignments for userId
  }
}
*/
