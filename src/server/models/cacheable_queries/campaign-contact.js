import { r, loaders, CampaignContact } from "../../models";
import optOutCache from "./opt-out";
import organizationCache from "./organization";
import { modelWithExtraProps } from "./lib";
import { Writable } from "stream";

// <campaignContactId>
//   - assignmentId
//   - campaignId
//   - orgId
//   - userId
//   - messageServiceSid
//   - firstName
//   - lastName
//   - cell
//   - zip
//   - customFields
//   - location{} (join on zip)
//     - city
//     - state
//     - timezone{ offset, hasDST }

//   OTHER DATA (see other files)
//   - optOut
//   - questionResponseValues
//   - messageStatus
//   - messages

// stores most of the contact info:
const cacheKey = id => `${process.env.CACHE_PREFIX || ""}contact-${id}`;

// just stores messageStatus -- this changes more often than the rest of the contact info
const messageStatusKey = id =>
  `${process.env.CACHE_PREFIX || ""}contactstatus-${id}`;

// allows a lookup of contact_id, assignment_id, and timezone_offset by cell+messageservice_sid
const cellTargetKey = (cell, messageServiceSid) =>
  `${process.env.CACHE_PREFIX || ""}cell-${cell}-${messageServiceSid || "x"}`;

// HASH<campaignId> assignment_id and user_id (sometimes) of assignment
// This allows us to clear assignment cache all at once for a campaign
const contactAssignmentKey = campaignId =>
  `${process.env.CACHE_PREFIX || ""}contactassignment-${campaignId}`;

const CONTACT_CACHE_ENABLED =
  process.env.REDIS_CONTACT_CACHE || global.REDIS_CONTACT_CACHE;

const generateCacheRecord = (
  dbRecord,
  organizationId,
  messageServiceSid,
  campaign
) => ({
  // This should be contactinfo that
  // never needs to be updated by an action of the texter or contact
  id: dbRecord.id,
  // don't cache inside contact: using separate cache
  // assignment_id: dbRecord.assignment_id,
  // user_id: dbRecord.user_id, // assigned user_id
  campaign_id: dbRecord.campaign_id,
  organization_id: organizationId,
  dynamic_assignment: campaign.use_dynamic_assignment,
  messageservice_sid: messageServiceSid,
  first_name: dbRecord.first_name,
  last_name: dbRecord.last_name,
  cell: dbRecord.cell,
  custom_fields: dbRecord.custom_fields,
  zip: dbRecord.zip,
  external_id: dbRecord.external_id,
  // explicitly excluding:
  // message_status -- because it will be indexed by cell elsewhere
  // updated_at -- because we will not update it
  timezone_offset: dbRecord.timezone_offset,
  city: dbRecord.city,
  state: dbRecord.state
});

export const setCacheContactAssignment = async (id, campaignId, contactObj) => {
  if (
    r.redis &&
    CONTACT_CACHE_ENABLED &&
    contactObj &&
    contactObj.assignment_id
  ) {
    const assignmentKey = contactAssignmentKey(campaignId);
    // console.log('setCacheContactAssignment', id, contactObj.assignment_id, contactObj.user_id, assignmentKey)
    await r.redis
      .multi()
      .hset(
        assignmentKey,
        id,
        [contactObj.assignment_id || "", contactObj.user_id || ""].join(":")
      )
      .expire(assignmentKey, 43200)
      .execAsync();
  }
};

export const getCacheContactAssignment = async (id, campaignId, contactObj) => {
  // console.log('getCacheContactAssignment0', id, contactObj.assignment_id);
  if (contactObj && contactObj.assignment_id) {
    return {
      assignment_id: contactObj.assignment_id,
      user_id: contactObj.user_id
    };
  }
  if (r.redis) {
    const contactAssignment = await r.redis.hgetAsync(
      contactAssignmentKey(campaignId),
      id
    );
    // console.log('getContactAssignmentCache1', contactAssignment)
    // eslint-disable-next-line camelcase
    const [assignment_id, user_id] = (contactAssignment || ":").split(":");
    // console.log('getContactAssignmentCache2', contactAssignment, assignment_id, user_id);
    // if empty string, then it's null
    return {
      assignment_id: assignment_id ? Number(assignment_id) : null,
      user_id: user_id ? Number(user_id) : null
    };
  } else {
    // if no cache, load it from the db
    const assignment = await r
      .knex("campaign_contact")
      .leftJoin("assignment", "assignment.id", "campaign_contact.assignment_id")
      .where("campaign_contact.id", id)
      .select("assignment_id", "user_id")
      .first();
    if (assignment) {
      await setCacheContactAssignment(id, campaignId, assignment);
      const { assignment_id, user_id } = assignment;
      return {
        assignment_id: assignment_id ? Number(assignment_id) : null,
        user_id: user_id ? Number(user_id) : null
      };
    }
  }
  return {};
};

const saveCacheRecord = async (
  dbRecord,
  organization,
  messageServiceSid,
  campaign
) => {
  if (r.redis) {
    // basic contact record
    const contactCacheObj = generateCacheRecord(
      dbRecord,
      organization.id,
      messageServiceSid,
      campaign
    );
    // console.log('contact saveCacheRecord', contactCacheObj)
    const contactKey = cacheKey(dbRecord.id);
    await r.redis
      .multi()
      .set(contactKey, JSON.stringify(contactCacheObj))
      .expire(contactKey, 43200)
      .execAsync();
    if (dbRecord.message_status) {
      // FUTURE: To avoid a write-syncing risk, before updating the status
      // we should check to see it doesn't exist before overwrite
      // This could also cause a problem, if the cache, itself, somehow gets out-of-sync
      const statusKey = messageStatusKey(dbRecord.id);
      await r.redis
        .multi()
        .set(statusKey, dbRecord.message_status)
        .expire(statusKey, 43200)
        .execAsync();
      //await updateAssignmentContact(dbRecord, dbRecord.message_status);
    }
    await setCacheContactAssignment(
      dbRecord.id,
      dbRecord.campaign_id,
      dbRecord
    );
  }
  // NOT INCLUDED: (All SET on first-text (i.e. updateStatus) rather than initial save)
  // - cellTargetKey <cell><messageservice_sid>: to not steal the cell from another campaign "too early"
  // - messages <contact_id>: because it's empty, dur
  // - questionResponseValues <contact_id>: also empty, dur
};

const getMessageStatus = async (id, contactObj) => {
  if (contactObj && contactObj.message_status) {
    return contactObj.message_status;
  }
  if (r.redis) {
    const msgStatus = await r.redis.getAsync(messageStatusKey(id));
    if (msgStatus) {
      return msgStatus;
    }
  }
  const [contact] = await r
    .knex("campaign_contact")
    .select("message_status")
    .where("id", id);
  return contact && contact.message_status;
};

const clearMemoizedCache = id => {
  loaders.campaignContact.clear(String(id));
  loaders.campaignContact.clear(Number(id));
};

const campaignContactCache = {
  clear: async (id, campaignId) => {
    if (r.redis) {
      await r.redis.delAsync(cacheKey(id), messageStatusKey(id));
      if (campaignId) {
        await r.redis.hdelAsync(contactAssignmentKey(id), id);
      }
    }
    clearMemoizedCache(id);
  },
  load: async (id, opts) => {
    if (r.redis && CONTACT_CACHE_ENABLED) {
      const cacheRecord = await r.redis.getAsync(cacheKey(id));
      if (cacheRecord) {
        // console.log('contact cacheRecord', cacheRecord)
        const cacheData = JSON.parse(cacheRecord);
        if (cacheData.cell && cacheData.organization_id) {
          cacheData.is_opted_out = await optOutCache.query({
            cell: cacheData.cell,
            organizationId: cacheData.organization_id
          });
        }
        cacheData.message_status = await getMessageStatus(id, cacheData);
        Object.assign(
          cacheData,
          await getCacheContactAssignment(id, cacheData.campaign_id, cacheData)
        );

        // console.log('contact fromCache', cacheData.id, cacheData.message_status)
        return modelWithExtraProps(cacheData, CampaignContact, [
          "organization_id",
          "city",
          "state",
          "user_id",
          "messageservice_sid",
          "dynamic_assignment"
        ]);
      }
      // Note that we don't try to load/save the cache
      // We keep the contact in the cache one time only, and then if it expires
      // the campaign is probably older, so let's just keep it out of cache.
      // Also, in order to loadMany, we need to load the campaign and organization info
      // which seems slightly burdensome per-contact
      // FUTURE: Maybe we will revisit this after we see performance data
    }
    return await CampaignContact.get(id);
  },
  loadMany: async (
    campaign,
    organization,
    { queryFunc, remainingMilliseconds }
  ) => {
    // queryFunc(query) has query input of a knex query
    // queryFunc should return a query with added where clauses
    if (
      !r.redis ||
      !CONTACT_CACHE_ENABLED ||
      !organization ||
      !(campaign || queryFunc)
    ) {
      return;
    }
    console.log("campaign-contact loadMany", campaign.id);
    loaders.campaignContact.clearAll();
    // 1. load the data
    let query = r
      .knex("campaign_contact")
      .leftJoin("zip_code", "zip_code.zip", "campaign_contact.zip")
      .leftJoin("assignment", "assignment.id", "campaign_contact.assignment_id")
      .select(
        "campaign_contact.id",
        "campaign_contact.assignment_id",
        "campaign_contact.campaign_id",
        "assignment.user_id",
        "campaign_contact.first_name",
        "campaign_contact.last_name",
        "campaign_contact.cell",
        "campaign_contact.custom_fields",
        "campaign_contact.zip",
        "campaign_contact.external_id",
        "campaign_contact.message_status",
        "campaign_contact.timezone_offset",
        "zip_code.city",
        "zip_code.state"
      );
    if (queryFunc) {
      query = queryFunc(query);
    } else {
      query = query.where("campaign_contact.campaign_id", campaign.id);
    }
    let messageServiceSid = await organizationCache.getMessageServiceSid(
      organization
    );
    // We process the results in a stream, because this could be a very large result
    // For docs see:
    // https://knexjs.org/#Interfaces-Streams
    // https://github.com/substack/stream-handbook#creating-a-writable-stream
    await query.stream(stream => {
      const cacheSaver = new Writable({ objectMode: true });
      // eslint-disable-next-line no-underscore-dangle
      cacheSaver._write = (dbRecord, enc, next) => {
        // Note: non-async land
        if (dbRecord.id % 1000 === 0) {
          console.log("contact loadMany contacts", campaign.id, dbRecord.id);
        }
        saveCacheRecord(
          dbRecord,
          organization,
          messageServiceSid,
          campaign
        ).then(
          () => {
            // If we are passed a remainingMilliseconds function, then
            // run it and see if we're almost at-time.
            // The rest of the cache loading will have to be done later
            // FUTURE: consider making this a job that can divide work up and complete
            if (
              typeof remainingMilliseconds === "function" &&
              remainingMilliseconds() < 2000
            ) {
              stream.end();
            }
            next();
          },
          err => {
            console.error("FAILED CONTACT CACHE SAVE", err);
            stream.end();
            next();
          }
        );
      };
      stream.pipe(cacheSaver);
    });
    console.log("contact loadMany finish stream", campaign.id);
  },
  lookupByCell: async (cell, service, messageServiceSid, bailWithoutCache) => {
    // Used to lookup contact/campaign information by cell number for incoming messages
    // in order to map it to the existing campaign, since Twilio, etc "doesn't know"
    // what campaign or other objects this is.
    // In non-cache settings, this is done through looking up the last message
    // that was sent to the cell phone.  Since Spoke always accepts "just replies"
    // after an initial outgoing message, there should always be a 'last message'
    // The cached version uses the info added in the updateStatus (of a contact) method below
    // which is called for incoming AND outgoing messages.
    if (r.redis && CONTACT_CACHE_ENABLED) {
      const cellData = await r.redis.getAsync(
        cellTargetKey(cell, messageServiceSid)
      );
      // console.log('lookupByCell cache', cell, service, messageServiceSid, cellData)
      if (cellData) {
        // eslint-disable-next-line camelcase
        const [
          campaign_contact_id,
          assignment_id,
          timezone_offset
        ] = cellData.split(":");
        return {
          campaign_contact_id,
          assignment_id,
          timezone_offset,
          message_status: await getMessageStatus(campaign_contact_id)
        };
      }
      if (bailWithoutCache) {
        return false;
      }
    }
    const [lastMessage] = await r
      .knex("message")
      .select("campaign_contact_id")
      .where({
        is_from_contact: false,
        contact_number: cell,
        messageservice_sid: messageServiceSid,
        service
      })
      .orderBy("created_at", "desc")
      .limit(1);
    // console.log('lookupByCell db', cell, 'x', service, 'y', messageServiceSid, 'z', lastMessage)
    if (lastMessage) {
      return {
        campaign_contact_id: lastMessage.campaign_contact_id,
        service_id: lastMessage.service_id,
        message_id: lastMessage.id
        // NOTE: no timezone_offset here
        // That's ok, because we only need it in the caching case to update assignment info
      };
    }
    return false;
  },
  getMessageStatus,
  updateAssignmentCache: async (
    contactId,
    newAssignmentId,
    newUserId,
    campaignId
  ) => {
    await setCacheContactAssignment(contactId, campaignId, {
      assignment_id: newAssignmentId,
      user_id: newUserId
    });
    clearMemoizedCache(contactId);
  },
  updateCampaignAssignmentCache: async (campaignId, contactIds) => {
    if (r.redis && CONTACT_CACHE_ENABLED) {
      const assignmentKey = contactAssignmentKey(campaignId);
      // We do NOT delete current cache as mostly people are re-assigned.
      // When people are zero-d out, then the assignments themselves are deleted
      // await r.redis.delAsync(assignmentKey);
      // Now refill it, streaming for efficiency
      let query = r
        .knex("campaign_contact")
        .where("campaign_id", campaignId)
        .select("id", "assignment_id");
      if (contactIds) {
        query = query.whereIn("id", contactIds);
      }
      const result = query.stream(stream => {
        const cacheSaver = new Writable({ objectMode: true });
        // eslint-disable-next-line no-underscore-dangle
        cacheSaver._write = (dbRecord, enc, next) => {
          // Note: non-async land
          setCacheContactAssignment(dbRecord.id, campaignId, dbRecord).then(
            () => {
              next();
            },
            err => {
              console.error("FAILED CAMPAIGN ASSIGNMENT CACHE SAVE", err);
              stream.end();
              next();
            }
          );
        };
        stream.pipe(cacheSaver);
      });
      return result
        .then(done => {
          console.log("updateCampaignAssignmentCache Completed", campaignId);
        })
        .catch(err => {
          console.log("updateCampaignAssignmentCache Error", campaignId, err);
        });
    }
  },
  updateStatus: async (contact, newStatus) => {
    // console.log('updateSTATUS', newStatus, contact)
    try {
      await r
        .knex("campaign_contact")
        .where("id", contact.id)
        .update({ message_status: newStatus, updated_at: new Date() });

      if (r.redis && CONTACT_CACHE_ENABLED) {
        const contactKey = cacheKey(contact.id);
        const statusKey = messageStatusKey(contact.id);
        // NOTE: contact.messageservice_sid is not a field, but will have been
        //       added on to the contact object from message.save
        // Other contexts don't really need to update the cell key -- just the status
        const cellKey = cellTargetKey(contact.cell, contact.messageservice_sid);
        // console.log('contact updateStatus', cellKey, newStatus, contact)
        await r.redis
          .multi()
          .set(statusKey, newStatus)
          // We update the cell info on status updates, because this happens
          // during message sending -- this is exactly the moment we want to
          // 'steal' a cell from one (presumably older) campaign into another
          .set(
            cellKey,
            [contact.id, contact.assignment_id, contact.timezone_offset].join(
              ":"
            )
          )
          // delay expiration for contacts we continue to update
          .expire(contactKey, 43200)
          .expire(statusKey, 43200)
          .expire(cellKey, 43200)
          .execAsync();
        //await updateAssignmentContact(contact, newStatus);
      }
      clearMemoizedCache(contact.id);
    } catch (err) {
      console.log(
        "contact updateStatus Error",
        cellKey,
        newStatus,
        contact,
        err
      );
    }

    // console.log('updateStatus, CONTACT', contact)
  }
};

export default campaignContactCache;
