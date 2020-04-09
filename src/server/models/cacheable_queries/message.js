import { r, Message } from "../../models";
import campaignCache from "./campaign";
import campaignContactCache from "./campaign-contact";

// QUEUE
// messages-<contactId>
// Expiration: 24 hours after last message added
//   The message cache starts when the first message is sent initially.
//   After that, presumably a conversation will continue in cache, and then fade away.

// TODO: Does query() need to support other args, or should we simplify/require a contactId

const cacheKey = contactId =>
  `${process.env.CACHE_PREFIX || ""}messages-${contactId}`;

const CONTACT_CACHE_ENABLED =
  process.env.REDIS_CONTACT_CACHE || global.REDIS_CONTACT_CACHE;

const dbQuery = ({ campaignContactId }) => {
  return r
    .knex("message")
    .where("campaign_contact_id", campaignContactId)
    .orderBy("created_at");
};

const contactIdFromOther = async ({
  campaignContactId,
  assignmentId,
  cell,
  service,
  messageServiceSid
}) => {
  if (campaignContactId) {
    return campaignContactId;
  }
  console.error(
    "contactIdfromother hard",
    campaignContactId,
    assignmentId,
    cell,
    service
  );

  if (!assignmentId || !cell || !messageServiceSid) {
    throw new Error(`campaignContactId required or assignmentId-cell-service-messageServiceSid triple required.
                    cell: ${cell}, messageServivceSid: ${messageServiceSid}, assignmentId: ${assignmentId}
                    `);
  }
  if (r.redis) {
    const cellLookup = await campaignContactCache.lookupByCell(
      cell,
      service || "",
      messageServiceSid,
      /* bailWithoutCache*/ true
    );
    if (cellLookup) {
      return cellLookup.campaign_contact_id;
    }
  }
  // TODO: more ways and by db -- is this necessary if the active-campaign-postmigration edgecase goes away?
  return null;
};

const saveMessageCache = async (contactId, contactMessages, overwriteFull) => {
  if (r.redis && CONTACT_CACHE_ENABLED) {
    const key = cacheKey(contactId);
    let redisQ = r.redis.multi();
    if (overwriteFull) {
      redisQ = redisQ.del(key);
    }

    await redisQ
      .lpush(
        key,
        contactMessages.map(m =>
          JSON.stringify({
            ...m, // don't cache service_response key
            service_response: undefined
          })
        )
      )
      .expire(key, 43200)
      .execAsync();
  }
};

const cacheDbResult = async dbResult => {
  // We assume we are getting a result that is comprehensive for each contact
  if (r.redis && CONTACT_CACHE_ENABLED) {
    const contacts = {};
    dbResult.forEach(m => {
      if (m.campaign_contact_id in contacts) {
        contacts[m.campaign_contact_id].push(m);
      } else {
        contacts[m.campaign_contact_id] = [m];
      }
    });
    const contactIds = Object.keys(contacts);
    for (let i = 0, l = contactIds.length; i < l; i++) {
      const c = contactIds[i];
      await saveMessageCache(c, contacts[c], true);
    }
  }
};

const query = async ({ campaignContactId }) => {
  // queryObj ~ { campaignContactId, assignmentId, cell, service, messageServiceSid }
  if (r.redis && CONTACT_CACHE_ENABLED) {
    // campaignContactId = await contactIdFromOther(queryObj);
    if (campaignContactId) {
      const [exists, messages] = await r.redis
        .multi()
        .exists(cacheKey(campaignContactId))
        .lrange(cacheKey(campaignContactId), 0, -1)
        .execAsync();
      // console.log('cached messages exist?', exists, messages)
      if (exists) {
        // note: lrange returns messages in reverse order
        return messages.reverse().map(m => JSON.parse(m));
      }
    }
  }
  // console.log('dbQuery', campaignContactId)
  const dbResult = await dbQuery({ campaignContactId });
  await cacheDbResult(dbResult);
  return dbResult;
};

const incomingMessageMatching = async (messageInstance, activeCellFound) => {
  if (!activeCellFound) {
    // No active thread to attach message to. This should be very RARE
    // This could happen way after a campaign is closed and a contact responds 'very late'
    // or e.g. gives the 'number for moveon' to another person altogether that tries to text it.
    console.error("ORPHAN MESSAGE", messageInstance, activeCellFound);
    return "ORPHAN MESSAGE";
  }
  // Check to see if the message is a duplicate of the last one
  // if-case==db result from lastMessage, else-case==cache-result
  if (activeCellFound.service_id) {
    // DB non-caching contect
    if (messageInstance.service_id === activeCellFound.service_id) {
      // already saved the message -- this is a duplicate message
      console.error("DUPLICATE MESSAGE DB", messageInstance, activeCellFound);
      return "DUPLICATE MESSAGE DB";
    }
  } else {
    // cached context looking through message thread
    const messageThread = await query({
      campaignContactId: activeCellFound.campaign_contact_id
    });
    const redundant = messageThread.filter(
      m => m.service_id && m.service_id === messageInstance.service_id
    );
    if (redundant.length) {
      console.error(
        "DUPLICATE MESSAGE CACHE",
        messageInstance,
        activeCellFound
      );
      return "DUPLICATE MESSAGE CACHE";
    }
  }
};

const messageCache = {
  clearQuery: async queryObj => {
    if (r.redis) {
      const contactId = await contactIdFromOther(queryObj);
      await r.redis.delAsync(cacheKey(contactId));
    }
  },
  query,
  save: async ({ messageInstance, contact }) => {
    // 0. Gathers any missing data in the case of is_from_contact: campaign_contact_id
    // 1. Saves the messageInstance
    // 2. Updates the campaign_contact record with an updated status and updated_at
    // 3. Updates all the related caches

    // console.log('message SAVE', contact, messageInstance)
    const messageToSave = { ...messageInstance };
    let newStatus = "needsResponse";

    if (messageInstance.is_from_contact) {
      // console.log('message SAVE lookup')
      const activeCellFound = await campaignContactCache.lookupByCell(
        messageInstance.contact_number,
        messageInstance.service,
        messageInstance.messageservice_sid
      );
      // console.log('activeCellFound', activeCellFound)
      const matchError = await incomingMessageMatching(
        messageInstance,
        activeCellFound
      );
      if (matchError) {
        return { error: matchError };
      }
      messageToSave.campaign_contact_id =
        messageInstance.campaign_contact_id ||
        activeCellFound.campaign_contact_id;
    } else {
      // IS from contact:
      newStatus =
        contact.message_status === "needsResponse" ||
        contact.message_status === "convo"
          ? "convo"
          : "messaged";
    }

    messageToSave.created_at = new Date();
    const savedMessage = await Message.save(
      messageToSave,
      messageToSave.id ? { conflict: "update" } : undefined
    );
    // We modify this info for sendMessage so it can send through the service with the id, etc.
    // eslint-disable-next-line no-param-reassign
    messageToSave.id = messageInstance.id || savedMessage.id;

    await saveMessageCache(messageToSave.campaign_contact_id, [messageToSave]);
    const contactData = {
      id: messageToSave.campaign_contact_id,
      cell: messageToSave.contact_number,
      messageservice_sid: messageToSave.messageservice_sid
    };
    // console.log('hi saveMsg3', newStatus, contactData);
    await campaignContactCache.updateStatus(contactData, newStatus);
    // console.log('hi saveMsg4', newStatus)
    if (
      !messageInstance.is_from_contact &&
      contact.message_status === "needsMessage"
    ) {
      await campaignCache.incrMessaged(contact.campaign_id);
    }
    return {
      message: messageToSave,
      contactStatus: newStatus
    };
  }
};

export default messageCache;
