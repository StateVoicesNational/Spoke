import { r } from "../../models";

// Datastructure:
// * regular GET/SET with JSON ordered list of the objects {id,title,text}
// * keyed by campaignId-userId pairs -- userId is '' for global campaign records
// Requirements:
// * needs an order
// * needs to get by campaignId-userId pairs

const getCacheKey = (organizationId, contactNumber) =>
  `${process.env.CACHE_PREFIX ||
    ""}contact-user-number-${organizationId}-${contactNumber}`;

const contactUserNumberCache = {
  query: async ({ organizationId, contactNumber }) => {
    const cacheKey = getCacheKey(organizationId, contactNumber);

    if (r.redis) {
      const contactUserNumber = await r.redis.getAsync(cacheKey);

      if (contactUserNumber) {
        return JSON.parse(contactUserNumber);
      }
    }

    const contactUserNumber = await r
      .table("contact_user_number")
      .filter({
        organization_id: organizationId,
        contact_number: contactNumber
      })
      .limit(1)(0)
      .default(null);

    if (r.redis) {
      await r.redis
        .multi()
        .set(cacheKey, JSON.stringify(contactUserNumber))
        .expire(cacheKey, 43200) // 12 hours
        .execAsync();
    }

    return contactUserNumber;
  },
  save: async ({ organizationId, contactNumber, userNumber }) => {
    const contactUserNumber = {
      organization_id: organizationId,
      contact_number: contactNumber,
      user_number: userNumber
    };

    await r.knex("contact_user_number").insert(contactUserNumber);

    await r
      .knex("owned_phone_number")
      .where({ phone_number: userNumber })
      .increment("stuck_contacts", 1);

    if (r.redis) {
      const cacheKey = getCacheKey(organizationId, contactNumber);

      await r.redis
        .multi()
        .set(cacheKey, JSON.stringify(contactUserNumber))
        .expire(cacheKey, 43200) // 12 hours
        .execAsync();
    }
  },
  remove: async ({ organizationId, contactNumber }) => {
    const [contactUserNumber] = await r
      .knex("contact_user_number")
      .where({
        organization_id: organizationId,
        contact_number: contactNumber
      })
      .returning("*")
      .delete();

    if (contactUserNumber) {
      await r
        .knex("owned_phone_number")
        .where({ phone_number: contactUserNumber.user_number })
        .increment("stuck_contacts", -1);
    }
  }
};

export default contactUserNumberCache;
