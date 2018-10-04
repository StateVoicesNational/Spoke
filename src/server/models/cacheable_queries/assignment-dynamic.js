import { r } from '../../models'
import { getTotalContactCount, getTimezoneOffsets, updateAssignmentContact } from './assignment-contacts'
import { getCacheContactAssignment, setCacheContactAssignment } from './campaign-contact'

// LIST needsMessage-<campaignId> to use ZPOPMIN to assign into inFlight
// FUTURE: When Redis 5.0 is more widely available (e.g. on AWS)
//   we should use a SORTED SET and ZPOPMIN to pop results off the list to make duplicates impossible
const needsMessageQueueKey = (campaignId, tz) => `${process.env.CACHE_PREFIX || ''}needsMessage-${campaignId}-${tz}`

// SORTED SET inflight-<campaignId> with key=<contactId>, score=<userId>
const inFlightKey = (campaignId) => `${process.env.CACHE_PREFIX || ''}inflight-${campaignId}`


const currentUserInflight = async (assignment) => {
  // Returns the count of in-flight assignments for the assignment
  console.log('currentUserInflight', assignment.id, assignment.user_id)
  if (r.redis) {
    const key = inFlightKey(assignment.campaign_id)
    const [exists, count] = await r.redis.multi()
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

const pushInFlight = async (assignment, contactId) => {
  // Adds a contact to the assignment/user's in-flight list
  // (it will be popped when they send a message)
  if (r.redis) {
    const key = inFlightKey(assignment.campaign_id)
    console.log('popinflight', assignment.campaign_id, assignment.user_id, contactId, key)
    await r.redis.multi()
      .zadd([key, assignment.user_id, contactId])
      .expire(key, 86400)
      .execAsync()
  }
}

export const popInFlight = async (campaignId, contactId) => {
  // Function to remove a contact from the campaign's inflight list
  // (called when the user sends a message to the contact)
  if (r.redis) {
    const key = inFlightKey(campaignId)
    console.log('popinflight', campaignId, contactId, key)
    await r.redis.multi()
      .zrem(key, contactId)
      .expire(key, 86400)
      .execAsync()
  }
}

const popNeedsMessage = async (assignment, campaign, organization, numberContacts) => {
  // Looks for contacts to assign
  // If available, then assigns them and push them to assignee (ONLY in-cache)
  // Used from findNewContacts
  // ASSUMES we've already checked various reasons and counts for the campaign and assignment
  console.log('popNeedsMessage', assignment.id, campaign.id, numberContacts)
  if (r.redis) {
    const newContacts = []
    // 1. POP contacts from needsMessage queue
    const timezoneOffsets = getTimezoneOffsets(organization, campaign,
                                               /* validTimezones */ true)
    // shuffle timezones, so we grab contacts from them in random order
    timezoneOffsets.sort(() => Math.random() - 0.5)
    const popN = (key, N) => {
      // pop N results from a redis list
      let rquery = r.redis.multi().expire(key, 86400)
      for (let i = 0; i < N; i++) {
        rquery = rquery.lpop(key)
      }
      return rquery
    }
    for (let i = 0, l = timezoneOffsets.length; i < l; i++) {
      const tz = timezoneOffsets[i]
      const key = needsMessageQueueKey(campaign.id, tz)
      const poppedContacts = (await popN(key, numberContacts - newContacts.length)
        .execAsync())
        .filter(cid => cid) // only values with results
        .map(cid => ({ id: cid, timezone_offset: tz }))
      newContacts.push(...poppedContacts)
      if (newContacts.length >= numberContacts) {
        break
      }
    }
    console.log('popNeedsMessage2', newContacts)
    // FUTURE: 1.1 if not enough there, then look for stale protoassignments in inflight queue
    // NOTE: Below we check inflight queue
    if (!newContacts.length) {
      return [] // bail early. Note this should NOT be null which is interpreted differently
    }
    const finalContactIds = []
    
    for (let j = 0, l = newContacts.length; j < l; j++) {
      const cPartial = newContacts[j]
      const cAssignmentData = await getCacheContactAssignment(cPartial.id)
      // 2. Ensure that they aren't already assigned (accidental dupes)
      if (cAssignmentData && cAssignmentData.assignment_id) {
        continue // skip, because this already has an assignment
      }
      Object.assign(cPartial, { assignment_id: assignment.id,
                                user_id: assignment.user_id })
      // 3. Check if the contact is 'inflight'
      const curInFlight = await r.redis.zscoreAsync(inFlightKey(assignment.campaign_id), cPartial.id)
      if (curInFlight) {
        // FUTURE: if we are searching for contacts from stale inflights
        // then this check might be 'circular'
        continue
      }
      console.log('popNeedsMessage3 contact to save', cPartial)
      // 4. Push contactIds with assignmentId score onto inflight
      await pushInFlight(assignment, cPartial.id)
      // 5. Update contact.assignment_id and contact.user_id
      await setCacheContactAssignment(cPartial.id, cPartial)
      // 6. Push into assignment-contacts (with appropriate timezones!)
      await updateAssignmentContact(cPartial, 'needsMessage')

      finalContactIds.push(cPartial.id)
    }
    return finalContactIds
  }
  return null
}

export const reloadCampaignContactsForDynamicAssignment = async (campaign, organization, { remainingMilliseconds }) => {
  // Used to load all the contacts for dynamic assignment into cache
  // This should be done when a campaign is 'started'

  // TODO: what if this is 1million?  We shouldn't load them all
  console.log('reloadCampaignContactsForDynamicAssignment', campaign.id, organization.id, campaign.contactTimezones)
  if (r.redis && campaign.use_dynamic_assignment) {
    const contactsToDynAssign = (await r.knex('campaign_contact')
      .where({ is_opted_out: false,
               campaign_id: campaign.id,
               assignment_id: null
             })
      .select('id', 'timezone_offset'))
    if (campaign.contactTimezones) {
      await r.redis.delAsync(campaign.contactTimezones.map(tz => needsMessageQueueKey(campaign.id, tz)))
    }
    for (let i1000 = 0, l1000 = Math.ceil(contactsToDynAssign.length / 1000); i1000 < l1000; i1000++) {
      const tzs = {}
      contactsToDynAssign.slice(1000 * i1000, 1000 * i1000 + 1000).forEach((c) => {
        if (!(c.timezone_offset in tzs)) {
          tzs[c.timezone_offset] = []
        }
        tzs[c.timezone_offset].push(c.id)
      })
      const tzKeys = Object.keys(tzs)
      for (let i = 0, l = tzKeys.length; i < l; i++) {
        const tz = tzKeys[i]
        const key = needsMessageQueueKey(campaign.id, tz)
        await r.redis.multi()
          .lpush(key, ...tzs[tz])
          .expire(key, 86400)
          .execAsync()
      }
      if (typeof remainingMilliseconds === 'function') {
        if (remainingMilliseconds() < 2000) {
          // not enough time to keep caching stuff
          break
        }
      }
    }
  }
}

export const clearCampaign = async (campaign) => {
  // clears the dynamic assignment keys for a campaign
  // This could be done on-archive, etc.
  if (r.redis) {
    if (campaign.contactTimezones) {
      await r.redis.delAsync(campaign.contactTimezones.map(tz => needsMessageQueueKey(campaign.id, tz)))
    }
    await r.redis.delAsync(inFlightKey(campaign.id))
  }
}

export const findNewContacts = async (assignment, campaign, organization, numberContacts) => {
  // Returns false if none found, and returns true-ish value
  // If new contacts were assigned with DB then we return the count
  // If new contacts were assigned in cache-mode, we return an array of contactIds

  // 0. Basic stuff
  if (campaign.is_archived || !campaign.use_dynamic_assignment || assignment.max_contacts === 0) {
    return false
  }

  console.log('findNewContacts', assignment.id, campaign.id, numberContacts)
  // 1. Make sure texter isn't maxed out on contacts
  const contactsCount = await getTotalContactCount(assignment, campaign)

  let finalNumberContacts = numberContacts || 1
  if (assignment.max_contacts && contactsCount + finalNumberContacts > assignment.max_contacts) {
    finalNumberContacts = assignment.max_contacts - contactsCount
  }
  if (finalNumberContacts <= 0) {
    return false
  }
  console.log('findNewContacts2', finalNumberContacts, contactsCount)
  // 2. Make sure texter doesn't have too many messages in-flight
  //    i.e. Don't add more if they already have that many
  const inFlightCount = await currentUserInflight(assignment)
  if (inFlightCount >= finalNumberContacts) {
    return false
  }
  console.log('findNewContacts3', finalNumberContacts, inFlightCount)
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
    const poppedInFlight = await popNeedsMessage(assignment, campaign, organization, finalNumberContacts)
    if (poppedInFlight !== null) {
      // We were able to use the cache to see if there were contacts to dynamically assign
      if (!poppedInFlight.length) {
        return false
      }
      contactIds = poppedInFlight
    }
  }
  console.log('findNewContacts4', contactIds)
  const updatedCount = await r
    .knex('campaign_contact')
    .whereIn('id', contactIds)
    .update({ assignment_id: assignment.id })
  console.log('findNewContacts5', updatedCount)
  if (updatedCount > 0) {
    return (Array.isArray(contactIds) ? contactIds : updatedCount)
  }
  return false
}
